// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer;
let score = 0;
let timeLeft = 30;

const WIN_TARGET = 20;
const GAME_LENGTH_SECONDS = 30;
const BAD_DROP_CHANCE = 0.25;

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

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const gameContainer = document.getElementById("game-container");
const gameMessageEl = document.getElementById("game-message");

// Wait for button click to start the game
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = GAME_LENGTH_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  gameMessageEl.textContent = "";
  gameMessageEl.className = "game-message";
  startBtn.disabled = true;
  gameContainer.innerHTML = "";
  startBtn.textContent = "Playing...";

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 550);

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

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";
  const isBadDrop = Math.random() < BAD_DROP_CHANCE;

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
  drop.style.animationDuration = `${Math.random() * 1.8 + 2.5}s`;

  drop.addEventListener("click", () => {
    if (!gameRunning) return;

    if (isBadDrop) {
      score = Math.max(0, score - 1);
    } else {
      score += 1;
    }

    scoreEl.textContent = score;
    drop.remove();
  });

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";

  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  const didWin = score >= WIN_TARGET;
  const messagePool = didWin ? winningMessages : losingMessages;
  const randomIndex = Math.floor(Math.random() * messagePool.length);

  gameMessageEl.textContent = messagePool[randomIndex];
  gameMessageEl.className = `game-message ${didWin ? "win" : "lose"}`;

  if (didWin) {
    launchConfetti();
  }
}

function resetGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  score = 0;
  timeLeft = GAME_LENGTH_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  gameMessageEl.textContent = "";
  gameMessageEl.className = "game-message";

  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
  gameContainer.innerHTML = "";
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

