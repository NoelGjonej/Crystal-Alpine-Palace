/* ============================================================
   CRYSTAL ALPINE PALACE — app.js
   Booking engine: floor selection → room picking → form →
   price calculation → confirmation modal
   ============================================================ */

'use strict';

/* ----------------------------------------------------------------
   FLOOR DATA
   ---------------------------------------------------------------- */
const FLOORS = [
  {
    floor: 6,
    label: 'Sixth Floor — Penthouse Level',
    description: 'King suite · 2 guests · Alpine panorama',
    price: 1250,
    capacity: 2,
    beds: ['1 King-sized bed'],
    emoji: '👑',
  },
  {
    floor: 5,
    label: 'Fifth Floor — Sky Level',
    description: 'King suite · 2 guests · Elevated mountain views',
    price: 1000,
    capacity: 2,
    beds: ['1 King-sized bed'],
    emoji: '🏔️',
  },
  {
    floor: 4,
    label: 'Fourth Floor — Summit Level',
    description: 'King suite · 2 guests · Sweeping valley vistas',
    price: 750,
    capacity: 2,
    beds: ['1 King-sized bed'],
    emoji: '⛰️',
  },
  {
    floor: 3,
    label: 'Third Floor — Grand Level',
    description: 'Deluxe room · 3 guests · Lake & forest views',
    price: 750,
    capacity: 3,
    beds: ['1 King-sized bed', '2 Single beds'],
    emoji: '🌲',
  },
  {
    floor: 2,
    label: 'Second Floor — Superior Level',
    description: 'Family room · 4 guests · Garden & pool views',
    price: 1000,
    capacity: 4,
    beds: ['1 King-sized bed', '2 Single beds'],
    emoji: '🌿',
  },
  {
    floor: 1,
    label: 'First Floor — Grand Family Level',
    description: 'Family suite · 5 guests · Garden terrace access',
    price: 1250,
    capacity: 5,
    beds: ['1 King-sized bed', '3 Single beds'],
    emoji: '🌸',
  },
];

/* Room count per floor */
const ROOMS_PER_FLOOR = 20;

/* ----------------------------------------------------------------
   STATE
   ---------------------------------------------------------------- */
let selectedFloor  = null;   // FLOORS entry
let selectedRoom   = null;   // room number string e.g. "101"

/* ----------------------------------------------------------------
   DOM REFERENCES
   ---------------------------------------------------------------- */
const $ = id => document.getElementById(id);

const stepFloor   = $('step-floor');
const stepRoom    = $('step-room');
const stepDetails = $('step-details');

const floorGrid   = $('floorGrid');
const roomGrid    = $('roomGrid');
const floorLabel  = $('floorLabel');
const roomHint    = $('roomHint');
const roomSummary = $('roomSummary');

const nightsInput = $('nights');
const checkInInput = $('checkIn');
const guestsSelect = $('guests');

const pricePerNight = $('pricePerNight');
const priceNights   = $('priceNights');
const priceTotal    = $('priceTotal');

const bookingForm = $('bookingForm');
const backToFloor = $('backToFloor');
const backToRoom  = $('backToRoom');

const modalBackdrop = $('modalBackdrop');
const modalDetails  = $('modalDetails');
const modalClose    = $('modalClose');

/* ----------------------------------------------------------------
   HELPERS
   ---------------------------------------------------------------- */
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function formatEuro(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0,
  }).format(amount);
}

function scrollTo(el) {
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/* Set today as min date for check-in */
function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  checkInInput.setAttribute('min', today);
  if (!checkInInput.value) checkInInput.value = today;
}

/* ----------------------------------------------------------------
   STEP 1 — FLOOR GRID
   ---------------------------------------------------------------- */
function buildFloorGrid() {
  floorGrid.innerHTML = '';

  FLOORS.forEach(data => {
    const card = document.createElement('div');
    card.className = 'floor-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Select ${data.label}`);

    card.innerHTML = `
      <div class="floor-card-left">
        <h4>${data.emoji} ${data.label}</h4>
        <span class="floor-desc">${data.description}</span>
      </div>
      <div class="floor-card-right">
        <div class="floor-price">${formatEuro(data.price)}</div>
        <div class="floor-price-sub">per night</div>
      </div>
    `;

    card.addEventListener('click', () => selectFloor(data, card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFloor(data, card); }
    });

    floorGrid.appendChild(card);
  });
}

function selectFloor(data, cardEl) {
  /* Highlight selected floor card */
  document.querySelectorAll('.floor-card').forEach(c => c.classList.remove('active'));
  cardEl.classList.add('active');

  selectedFloor = data;
  selectedRoom  = null;

  /* Update step-2 header */
  floorLabel.textContent = `— ${data.label}`;
  roomHint.textContent   =
    `${ROOMS_PER_FLOOR} rooms available · ${data.description} · ${formatEuro(data.price)} / night`;

  buildRoomGrid();
  show(stepRoom);
  scrollTo(stepRoom);
}

/* ----------------------------------------------------------------
   STEP 2 — ROOM GRID
   ---------------------------------------------------------------- */
function buildRoomGrid() {
  roomGrid.innerHTML = '';

  for (let i = 1; i <= ROOMS_PER_FLOOR; i++) {
    /* Room numbers: floor 3, rooms 1-20 → 301–320 */
    const roomNum = `${selectedFloor.floor}${String(i).padStart(2, '0')}`;

    const card = document.createElement('div');
    card.className = 'room-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Room ${roomNum}`);

    card.innerHTML = `
      <span class="room-icon">🛏️</span>
      <span class="room-num">${roomNum}</span>
    `;

    card.addEventListener('click', () => selectRoom(roomNum, card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRoom(roomNum, card); }
    });

    roomGrid.appendChild(card);
  }
}

function selectRoom(roomNum, cardEl) {
  document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  selectedRoom = roomNum;

  buildRoomSummary();
  populateGuestOptions();
  updatePrice();
  show(stepDetails);
  scrollTo(stepDetails);
}

/* ----------------------------------------------------------------
   STEP 3 — DETAILS PANEL
   ---------------------------------------------------------------- */
function buildRoomSummary() {
  const f = selectedFloor;
  const bedsHtml = f.beds.map(b => `<span>🛏️ ${b}</span>`).join('');

  roomSummary.innerHTML = `
    <div class="rs-floor">${f.label}</div>
    <div class="rs-room">Room ${selectedRoom}</div>
    <div class="rs-beds">${bedsHtml}</div>
    <div class="rs-capacity">👤 Up to ${f.capacity} guest${f.capacity > 1 ? 's' : ''}</div>
    <div class="rs-rate">${formatEuro(f.price)}</div>
    <div class="rs-rate-sub">per night · breakfast included</div>
  `;
}

function populateGuestOptions() {
  guestsSelect.innerHTML = '';
  for (let g = 1; g <= selectedFloor.capacity; g++) {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = `${g} guest${g > 1 ? 's' : ''}`;
    guestsSelect.appendChild(opt);
  }
}

/* ----------------------------------------------------------------
   PRICE CALCULATION
   ---------------------------------------------------------------- */
function updatePrice() {
  if (!selectedFloor) return;

  const nights = Math.max(1, parseInt(nightsInput.value, 10) || 1);
  const total  = selectedFloor.price * nights;

  pricePerNight.textContent = formatEuro(selectedFloor.price);
  priceNights.textContent   = `${nights} night${nights > 1 ? 's' : ''}`;
  priceTotal.textContent    = formatEuro(total);
}

nightsInput.addEventListener('input', updatePrice);

/* ----------------------------------------------------------------
   NAVIGATION — BACK BUTTONS
   ---------------------------------------------------------------- */
backToFloor.addEventListener('click', () => {
  hide(stepRoom);
  hide(stepDetails);
  scrollTo(stepFloor);
});

backToRoom.addEventListener('click', () => {
  hide(stepDetails);
  scrollTo(stepRoom);
});

/* ----------------------------------------------------------------
   FORM VALIDATION
   ---------------------------------------------------------------- */
function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-msg').forEach(el => el.remove());
}

function showError(inputEl, msg) {
  inputEl.classList.add('error');
  const err = document.createElement('span');
  err.className = 'error-msg';
  err.textContent = msg;
  inputEl.parentNode.appendChild(err);
}

function validateForm() {
  clearErrors();
  let valid = true;

  const name    = $('guestName');
  const email   = $('guestEmail');
  const checkIn = $('checkIn');
  const nights  = $('nights');

  if (!name.value.trim()) {
    showError(name, 'Please enter your full name.');
    valid = false;
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRx.test(email.value)) {
    showError(email, 'Please enter a valid email address.');
    valid = false;
  }

  if (!checkIn.value) {
    showError(checkIn, 'Please select a check-in date.');
    valid = false;
  }

  const n = parseInt(nights.value, 10);
  if (!nights.value || isNaN(n) || n < 1 || n > 365) {
    showError(nights, 'Please enter a valid number of nights (1–365).');
    valid = false;
  }

  return valid;
}

/* ----------------------------------------------------------------
   FORM SUBMIT
   ---------------------------------------------------------------- */
bookingForm.addEventListener('submit', e => {
  e.preventDefault();

  if (!validateForm()) return;

  const nights   = parseInt(nightsInput.value, 10);
  const total    = selectedFloor.price * nights;
  const checkIn  = new Date($('checkIn').value);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);

  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  modalDetails.innerHTML = `
    <div class="md-row"><span>Guest</span>      <span>${$('guestName').value.trim()}</span></div>
    <div class="md-row"><span>Email</span>       <span>${$('guestEmail').value.trim()}</span></div>
    <div class="md-row"><span>Room</span>        <span>${selectedRoom} — ${selectedFloor.label}</span></div>
    <div class="md-row"><span>Guests</span>      <span>${guestsSelect.value} guest${guestsSelect.value > 1 ? 's' : ''}</span></div>
    <div class="md-row"><span>Check-in</span>    <span>${fmt(checkIn)}</span></div>
    <div class="md-row"><span>Check-out</span>   <span>${fmt(checkOut)}</span></div>
    <div class="md-row"><span>Duration</span>    <span>${nights} night${nights > 1 ? 's' : ''}</span></div>
    <div class="md-row md-total">
      <span>Total Amount</span>
      <span>${formatEuro(total)}</span>
    </div>
  `;

  show(modalBackdrop);
  document.body.style.overflow = 'hidden';
});

/* ----------------------------------------------------------------
   MODAL CLOSE
   ---------------------------------------------------------------- */
modalClose.addEventListener('click', () => {
  hide(modalBackdrop);
  document.body.style.overflow = '';

  /* Reset the whole booking flow */
  bookingForm.reset();
  clearErrors();
  hide(stepRoom);
  hide(stepDetails);
  selectedFloor = null;
  selectedRoom  = null;
  document.querySelectorAll('.floor-card').forEach(c => c.classList.remove('active'));

  /* Scroll back to top */
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Close modal on backdrop click */
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) modalClose.click();
});

/* ----------------------------------------------------------------
   INIT
   ---------------------------------------------------------------- */
function init() {
  setMinDate();
  buildFloorGrid();
}

document.addEventListener('DOMContentLoaded', init);
