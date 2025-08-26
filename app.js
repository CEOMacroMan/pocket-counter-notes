// Stage 1 counter and notes functionality
// No persistence; pure DOM manipulation

const valueEl = document.getElementById('value');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const resetBtn = document.getElementById('reset');

let count = 0;

function render() {
  valueEl.textContent = String(count);
  valueEl.parentElement.classList.toggle('negative', count < 0);
  resetBtn.disabled = count === 0;
}

incrementBtn.addEventListener('click', () => {
  count += 1;
  render();
});

decrementBtn.addEventListener('click', () => {
  count -= 1;
  render();
});

resetBtn.addEventListener('click', () => {
  count = 0;
  render();
});

render();

// Pomodoro timer
const pomodoroCard = document.getElementById('pomodoro-card');
const timeEl = document.getElementById('pomodoro-time');
const modeButtons = pomodoroCard.querySelectorAll('.modes button');
const startBtn = document.getElementById('pomodoro-start');
const resetTimerBtn = document.getElementById('pomodoro-reset');
const durationSelect = document.getElementById('pomodoro-duration');
const ringProgress = pomodoroCard.querySelector('.ring-progress');

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
ringProgress.style.strokeDasharray = CIRCUMFERENCE;

let pState = {
  mode: 'focus',
  durations: { focus: 25 * 60 * 1000, short: 5 * 60 * 1000, long: 15 * 60 * 1000 },
  endTime: null,
  remaining: 25 * 60 * 1000,
  running: false,
};

let tickId;

function saveState() {
  localStorage.setItem('pomodoroState', JSON.stringify(pState));
}

function applyMode() {
  pomodoroCard.classList.remove('focus', 'short', 'long');
  pomodoroCard.classList.add(pState.mode);
  modeButtons.forEach((btn) => {
    const active = btn.dataset.mode === pState.mode;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderTime() {
  const total = pState.durations[pState.mode];
  const minutes = Math.floor(pState.remaining / 60000);
  const seconds = Math.floor((pState.remaining % 60000) / 1000);
  timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const fraction = pState.remaining / total;
  const offset = CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
}

function updateControls() {
  startBtn.textContent = pState.running ? 'Pause' : 'Start';
  resetTimerBtn.disabled = pState.running || pState.remaining === pState.durations[pState.mode];
}

function tick() {
  const now = Date.now();
  pState.remaining = Math.max(0, pState.endTime - now);
  renderTime();
  if (pState.remaining > 0) {
    tickId = requestAnimationFrame(tick);
  } else {
    pState.running = false;
    pState.endTime = null;
    updateControls();
    saveState();
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = pState.mode === 'focus' ? 'Focus session complete' : 'Break finished';
      new Notification(message);
    }
  }
}

function startTimer() {
  if (pState.running) return;
  pState.endTime = Date.now() + pState.remaining;
  pState.running = true;
  tickId = requestAnimationFrame(tick);
  updateControls();
  saveState();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function pauseTimer() {
  if (!pState.running) return;
  pState.remaining = Math.max(0, pState.endTime - Date.now());
  pState.running = false;
  pState.endTime = null;
  cancelAnimationFrame(tickId);
  updateControls();
  saveState();
}

function resetTimer() {
  pState.running = false;
  pState.endTime = null;
  cancelAnimationFrame(tickId);
  pState.remaining = pState.durations[pState.mode];
  renderTime();
  updateControls();
  saveState();
}

function setMode(mode) {
  if (pState.mode === mode) return;
  pState.mode = mode;
  pState.running = false;
  pState.endTime = null;
  pState.remaining = pState.durations[mode];
  durationSelect.value = pState.durations[mode] / 60000;
  applyMode();
  renderTime();
  updateControls();
  saveState();
  startBtn.focus();
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

startBtn.addEventListener('click', () => {
  pState.running ? pauseTimer() : startTimer();
});

resetTimerBtn.addEventListener('click', resetTimer);

durationSelect.addEventListener('change', () => {
  const minutes = Number(durationSelect.value);
  pState.durations[pState.mode] = minutes * 60000;
  resetTimer();
});

document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
  switch (e.key) {
    case ' ':
      e.preventDefault();
      pState.running ? pauseTimer() : startTimer();
      break;
    case 'b':
      setMode('short');
      break;
    case 'l':
      setMode('long');
      break;
    case 'f':
      setMode('focus');
      break;
  }
});

function loadPomodoro() {
  const saved = localStorage.getItem('pomodoroState');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data) {
        pState = { ...pState, ...data };
      }
    } catch (e) {
      /* ignore */
    }
  }
  if (pState.running && pState.endTime) {
    pState.remaining = Math.max(0, pState.endTime - Date.now());
    if (pState.remaining === 0) {
      pState.running = false;
      pState.endTime = null;
    }
  } else {
    pState.remaining = pState.durations[pState.mode];
  }
  applyMode();
  durationSelect.value = pState.durations[pState.mode] / 60000;
  renderTime();
  updateControls();
  if (pState.running) {
    tickId = requestAnimationFrame(tick);
  }
}

loadPomodoro();
