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
