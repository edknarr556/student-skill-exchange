import { icon, starFilled } from './icons.js';
import { avatar, esc } from '../utils.js';

/**
 * Tutor card used in Browse + Dashboard recommendations.
 * Buttons carry data attributes handled by delegated listeners on the page:
 *   [data-view-profile], [data-request] (both with data-id).
 */
export function tutorCard(tutor) {
  const teach = tutor.skillsTeach || [];
  const tags = teach
    .slice(0, 3)
    .map((s) => `<span class="tag tag--teach">${esc(s.skill)}</span>`)
    .join('');
  const avail = (tutor.availability || [])[0] || 'Flexible';

  return `
    <article class="card card--hover tutor">
      <div class="tutor__top">
        ${avatar(tutor)}
        <div>
          <div class="tutor__name">${esc(tutor.name)}</div>
          <div class="tutor__meta">${esc(tutor.major)} · ${esc(tutor.year)}</div>
          <div class="rating mt-sm">${starFilled(14)} ${tutor.rating.toFixed(
    1
  )} <span class="muted" style="font-weight:500">(${tutor.reviews})</span></div>
        </div>
        <span class="badge badge--green badge--dot tutor__avail">${esc(avail)}</span>
      </div>

      <p class="tutor__desc">${esc(tutor.bio)}</p>

      <div class="tutor__tags">${tags}</div>

      <div class="row wrap mb" style="gap:14px">
        <span class="price">$${tutor.rate}/hr</span>
        ${
          tutor.openToExchange
            ? `<span class="badge badge--violet">${icon('swap', {
                size: 13,
              })} Open to skill swap</span>`
            : ''
        }
      </div>

      <div class="tutor__footer">
        <button class="btn btn--ghost btn--sm" data-view-profile data-id="${esc(
          tutor.id
        )}">${icon('user', { size: 16 })} Profile</button>
        <button class="btn btn--primary btn--sm" data-request data-id="${esc(
          tutor.id
        )}">${icon('calendar', { size: 16 })} Request</button>
      </div>
    </article>
  `;
}
