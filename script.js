// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer;
let score = 0;
let timeLeft = 30;

const difficultySettings = {
  easy: {
    name: "Easy",
    winTarget: 12,
    gameLengthSeconds: 36,
    spawnIntervalMs: 700,
    badDropChance: 0.15,
    fallDurationMin: 3.4,
    fallDurationRange: 2.2,
    missPenalty: 0
  },
  normal: {
    name: "Normal",
    winTarget: 20,
    gameLengthSeconds: 30,
    spawnIntervalMs: 550,
    badDropChance: 0.25,
    fallDurationMin: 2.5,
    fallDurationRange: 1.8,
    missPenalty: 0
  },
  hard: {
    name: "Hard",
    winTarget: 28,
    gameLengthSeconds: 24,
    spawnIntervalMs: 430,
    badDropChance: 0.35,
    fallDurationMin: 1.9,
    fallDurationRange: 1.3,
    missPenalty: 1
  }
};

let currentMode = "normal";
let reachedMilestones = new Set();
let audioContext;

const winningMessages = [
  "Amazing work! Every drop counts.",
  "You did it! Clean water champion.",
  "Victory! You caught enough drops to win."
];

const losingMessages = [
  "Nice effort. Try again and catch even more drops!",
  "So close. Give it another shot!",
  "Keep practicing. You can hit the goal next round!"
];

const milestoneMessages = [
  { score: 5, text: "Great start. 5 drops collected." },
  { score: 10, text: "Halfway there. Keep the momentum!" },
  { score: 15, text: "Strong pace. You are making a real impact." },
  { score: 20, text: "20 points reached. Clean water hero energy!" },
  { score: 25, text: "25 points. Outstanding work!" }
];

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const gameContainer = document.getElementById("game-container");
const gameMessageEl = document.getElementById("game-message");
const difficultyEl = document.getElementById("difficulty");
const goalEl = document.getElementById("goal");

// Wait for button click to start the game
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
difficultyEl.addEventListener("change", updateDifficulty);

function getModeSettings() {
  return difficultySettings[currentMode];
}

function updateDifficulty() {
  if (gameRunning) {
    difficultyEl.value = currentMode;
    return;
  }

  playSound("button");

  currentMode = difficultyEl.value;
  const settings = getModeSettings();
  goalEl.textContent = settings.winTarget;
  timeLeft = settings.gameLengthSeconds;
  timeEl.textContent = timeLeft;
  gameMessageEl.textContent = `${settings.name} mode selected.`;
  gameMessageEl.className = "game-message info";
}

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  playSound("button");

  const settings = getModeSettings();

  gameRunning = true;
  score = 0;
  reachedMilestones = new Set();
  timeLeft = settings.gameLengthSeconds;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  gameMessageEl.textContent = "";
  gameMessageEl.className = "game-message";
  startBtn.disabled = true;
  difficultyEl.disabled = true;
  gameContainer.innerHTML = "";
  startBtn.textContent = "Playing...";

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, settings.spawnIntervalMs);

  gameTimer = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function createDrop() {
  if (!gameRunning) return;

  const settings = getModeSettings();

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";
  const isBadDrop = Math.random() < settings.badDropChance;
  let wasCaught = false;

  if (isBadDrop) {
    drop.classList.add("bad-drop");
  }

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * Math.max(gameWidth - size, 0);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = `${Math.random() * settings.fallDurationRange + settings.fallDurationMin}s`;

  drop.addEventListener("click", () => {
    if (!gameRunning) return;
    if (wasCaught) return;

    wasCaught = true;
    const dropBounds = drop.getBoundingClientRect();
    const containerBounds = gameContainer.getBoundingClientRect();
    const splashX = dropBounds.left - containerBounds.left + (dropBounds.width / 2);
    const splashY = dropBounds.top - containerBounds.top + (dropBounds.height / 2);

    if (isBadDrop) {
      score = Math.max(0, score - 1);
      createSplash("-1", splashX, splashY, "bad");
      playSound("badCollect");
    } else {
      score += 1;
      createSplash("+1", splashX, splashY, "good");
      playSound("goodCollect");
      checkMilestone();
    }

    scoreEl.textContent = score;
    drop.style.animationPlayState = "paused";
    drop.classList.add("is-popping");
    setTimeout(() => drop.remove(), 120);
  });

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    if (!wasCaught && !isBadDrop) {
      if (settings.missPenalty > 0) {
        score = Math.max(0, score - settings.missPenalty);
      }

      scoreEl.textContent = score;
      playSound("miss");

      const dropBounds = drop.getBoundingClientRect();
      const containerBounds = gameContainer.getBoundingClientRect();
      const splashX = dropBounds.left - containerBounds.left + (dropBounds.width / 2);
      const splashY = Math.max(14, dropBounds.top - containerBounds.top);
      createSplash("Miss", splashX, splashY, "miss");
    }

    drop.remove(); // Clean up drops that weren't caught
  });
}

function endGame() {
  const settings = getModeSettings();

  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);
  startBtn.disabled = false;
  difficultyEl.disabled = false;
  startBtn.textContent = "Play Again";

  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  const didWin = score >= settings.winTarget;
  const messagePool = didWin ? winningMessages : losingMessages;
  const randomIndex = Math.floor(Math.random() * messagePool.length);

  gameMessageEl.textContent = `${messagePool[randomIndex]} (${settings.name} goal: ${settings.winTarget})`;
  gameMessageEl.className = `game-message ${didWin ? "win" : "lose"}`;

  if (didWin) {
    playSound("win");
    launchConfetti();
  } else {
    playSound("lose");
  }
}

function resetGame() {
  const settings = getModeSettings();

  playSound("button");

  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  score = 0;
  reachedMilestones = new Set();
  timeLeft = settings.gameLengthSeconds;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  goalEl.textContent = settings.winTarget;
  gameMessageEl.textContent = "";
  gameMessageEl.className = "game-message";

  startBtn.disabled = false;
  difficultyEl.disabled = false;
  startBtn.textContent = "Start Game";
  gameContainer.innerHTML = "";
}

function createSplash(text, x, y, type) {
  const splash = document.createElement("span");
  splash.className = `drop-splash ${type}`;
  splash.textContent = text;
  splash.style.left = `${x}px`;
  splash.style.top = `${y}px`;

  gameContainer.appendChild(splash);
  splash.addEventListener("animationend", () => splash.remove());
}

function checkMilestone() {
  const foundMilestone = milestoneMessages.find(
    (milestone) => milestone.score === score && !reachedMilestones.has(milestone.score)
  );

  if (!foundMilestone) return;

  reachedMilestones.add(foundMilestone.score);
  gameMessageEl.textContent = foundMilestone.text;
  gameMessageEl.className = "game-message milestone";
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone({
  frequency,
  secondFrequency,
  type = "sine",
  duration = 0.12,
  gainValue = 0.045
}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (secondFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(secondFrequency, now + duration);
  }

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, now + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function playSound(soundType) {
  if (soundType === "button") {
    playTone({ frequency: 420, secondFrequency: 520, type: "triangle", duration: 0.07, gainValue: 0.03 });
    return;
  }

  if (soundType === "goodCollect") {
    playTone({ frequency: 670, secondFrequency: 910, type: "sine", duration: 0.09, gainValue: 0.045 });
    return;
  }

  if (soundType === "badCollect") {
    playTone({ frequency: 260, secondFrequency: 170, type: "sawtooth", duration: 0.1, gainValue: 0.028 });
    return;
  }

  if (soundType === "miss") {
    playTone({ frequency: 210, secondFrequency: 120, type: "triangle", duration: 0.12, gainValue: 0.026 });
    return;
  }

  if (soundType === "win") {
    playTone({ frequency: 620, secondFrequency: 920, type: "triangle", duration: 0.14, gainValue: 0.045 });
    setTimeout(() => {
      playTone({ frequency: 880, secondFrequency: 1160, type: "sine", duration: 0.16, gainValue: 0.04 });
    }, 110);
    return;
  }

  if (soundType === "lose") {
    playTone({ frequency: 240, secondFrequency: 160, type: "square", duration: 0.15, gainValue: 0.022 });
  }
}

function launchConfetti() {
  const confettiColors = ["#FFC907", "#2E9DF7", "#F5402C", "#4FCB53", "#FF902A"];

  for (let i = 0; i < 120; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

updateDifficulty();
