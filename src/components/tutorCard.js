import { icon, starFilled } from './icons.js';
import { avatar, esc } from '../utils.js';

/**
 * Derive a stable "typically replies" hint from existing data only (no new
 * fields). Busier, higher-rated tutors read as quicker responders. Purely
 * presentational flavour — deterministic so it doesn't flicker between renders.
 */
function responseHint(tutor) {
  const score = (tutor.sessionsTaught || 0) + (tutor.reviews || 0);
  if (score > 70) return 'Replies within an hour';
  if (score > 40) return 'Replies within a few hours';
  return 'Replies within a day';
}

/**
 * Tutor card used in Browse + Dashboard recommendations.
 * Buttons carry data attributes handled by delegated listeners on the page:
 *   [data-view-profile], [data-request] (both with data-id).
 */
export function tutorCard(tutor) {
  const teach = tutor.skillsTeach || [];
  const shown = teach.slice(0, 2);
  const overflow = teach.length - shown.length;
  const tags =
    shown
      .map((s) => `<span class="tag tag--teach">${esc(s.skill)}</span>`)
      .join('') +
    (overflow > 0
      ? `<span class="tag tag--more" title="${esc(
          teach
            .slice(2)
            .map((s) => s.skill)
            .join(', ')
        )}">+${overflow} more</span>`
      : '');
  const avail = (tutor.availability || [])[0] || 'Flexible';
  const fullName = esc(tutor.name);

  return `
    <article class="card card--hover tutor" aria-label="${fullName}, tutor">
      <div class="tutor__top">
        ${avatar(tutor)}
        <div class="tutor__id">
          <div class="tutor__name">${fullName}</div>
          <div class="tutor__meta">${esc(tutor.major)} · ${esc(tutor.year)}</div>
          <div class="rating mt-sm" aria-label="Rated ${tutor.rating.toFixed(
            1
          )} out of 5 from ${tutor.reviews} reviews">
            ${starFilled(14)} ${tutor.rating.toFixed(
    1
  )} <span class="muted" style="font-weight:500">(${tutor.reviews})</span>
          </div>
        </div>
        <span class="badge badge--green badge--dot tutor__avail">${esc(
          avail
        )}</span>
      </div>

      <p class="tutor__desc">${esc(tutor.bio)}</p>

      <div class="tutor__tags">${tags}</div>

      <div class="tutor__micro">
        <span class="tutor__micro-item">${icon('clock', {
          size: 14,
        })} ${esc(responseHint(tutor))}</span>
      </div>

      <div class="tutor__meta-row">
        <span class="price">$${tutor.rate}<span class="price__unit">/hr</span></span>
        ${
          tutor.openToExchange
            ? `<span class="badge badge--violet">${icon('swap', {
                size: 13,
              })} Skill swap</span>`
            : ''
        }
      </div>

      <div class="tutor__footer">
        <button class="btn btn--ghost btn--sm tutor__profile" data-view-profile
          data-id="${esc(tutor.id)}" aria-label="View ${fullName}'s profile">
          ${icon('user', { size: 16 })} Profile
        </button>
        <button class="btn btn--primary tutor__request" data-request
          data-id="${esc(tutor.id)}" aria-label="Request a session with ${fullName}">
          ${icon('calendar', { size: 16 })} Request session
        </button>
      </div>
    </article>
  `;
}
