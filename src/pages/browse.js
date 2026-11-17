import { icon } from '../components/icons.js';
import { tutorCard } from '../components/tutorCard.js';
import { esc, options } from '../utils.js';
import { getTutors } from '../store/state.js';
import { SUBJECTS, AVAILABILITY } from '../store/seed.js';
import { bindTutorActions } from './shared.js';
import { navigate } from '../router.js';

// Keep filter state across re-renders within the page lifetime.
const filters = { q: '', subject: 'All subjects', avail: 'Any availability', sort: 'rating' };

export function renderBrowse(_params, query) {
  if (query.q !== undefined) filters.q = query.q;

  const list = applyFilters(getTutors(), filters);

  return `
    <div class="page">
      <div class="page__head">
        <div>
          <span class="eyebrow">Marketplace</span>
          <h1>Browse skills & tutors</h1>
          <p>Find a peer who teaches what you want to learn.</p>
        </div>
      </div>

      <div class="filterbar">
        <div class="search">
          ${icon('search', { size: 18 })}
          <input id="f-q" type="search" placeholder="Search by name, skill, or keyword…" value="${esc(
            filters.q
          )}" />
        </div>
        <select class="select" id="f-subject">
          ${options(['All subjects', ...SUBJECTS], filters.subject)}
        </select>
        <select class="select" id="f-avail">
          ${options(['Any availability', ...AVAILABILITY], filters.avail)}
        </select>
        <select class="select" id="f-sort">
          <option value="rating"${
            filters.sort === 'rating' ? ' selected' : ''
          }>Top rated</option>
          <option value="price-low"${
            filters.sort === 'price-low' ? ' selected' : ''
          }>Price: low to high</option>
          <option value="price-high"${
            filters.sort === 'price-high' ? ' selected' : ''
          }>Price: high to low</option>
          <option value="sessions"${
            filters.sort === 'sessions' ? ' selected' : ''
          }>Most experienced</option>
        </select>
      </div>

      <p class="muted mb" id="result-count" style="font-size:.86rem">
        ${list.length} tutor${list.length === 1 ? '' : 's'} found
      </p>

      <div class="grid grid--cards" id="tutor-grid">
        ${
          list.length
            ? list.map(tutorCard).join('')
            : `<div class="empty" style="grid-column:1/-1">
                 <div class="empty__icon">${icon('search', { size: 28 })}</div>
                 <h3>No tutors match your filters</h3>
                 <p>Try a different subject, clear the search, or widen availability.</p>
               </div>`
        }
      </div>
    </div>
  `;
}

function applyFilters(tutors, f) {
  let out = tutors.filter((t) => {
    const hay = (
      t.name +
      ' ' +
      t.major +
      ' ' +
      t.bio +
      ' ' +
      t.skillsTeach.map((s) => s.skill + ' ' + s.subject).join(' ')
    ).toLowerCase();
    if (f.q && !hay.includes(f.q.toLowerCase())) return false;
    if (
      f.subject !== 'All subjects' &&
      !t.skillsTeach.some((s) => s.subject === f.subject)
    )
      return false;
    if (
      f.avail !== 'Any availability' &&
      !(t.availability || []).includes(f.avail)
    )
      return false;
    return true;
  });

  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    'price-low': (a, b) => a.rate - b.rate,
    'price-high': (a, b) => b.rate - a.rate,
    sessions: (a, b) => b.sessionsTaught - a.sessionsTaught,
  };
  return out.sort(sorters[f.sort] || sorters.rating);
}

export function mountBrowse() {
  const view = document.getElementById('view');
  const grid = view.querySelector('#tutor-grid');
  const count = view.querySelector('#result-count');

  function refresh() {
    const list = applyFilters(getTutors(), filters);
    count.textContent = `${list.length} tutor${
      list.length === 1 ? '' : 's'
    } found`;
    grid.innerHTML = list.length
      ? list.map(tutorCard).join('')
      : `<div class="empty" style="grid-column:1/-1">
           <div class="empty__icon">${icon('search', { size: 28 })}</div>
           <h3>No tutors match your filters</h3>
           <p>Try a different subject, clear the search, or widen availability.</p>
         </div>`;
  }

  const q = view.querySelector('#f-q');
  q.addEventListener('input', (e) => {
    filters.q = e.target.value;
    refresh();
  });
  view.querySelector('#f-subject').addEventListener('change', (e) => {
    filters.subject = e.target.value;
    refresh();
  });
  view.querySelector('#f-avail').addEventListener('change', (e) => {
    filters.avail = e.target.value;
    refresh();
  });
  view.querySelector('#f-sort').addEventListener('change', (e) => {
    filters.sort = e.target.value;
    refresh();
  });

  bindTutorActions(view);
}
