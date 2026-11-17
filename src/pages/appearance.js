import { icon, starFilled } from '../components/icons.js';
import { esc } from '../utils.js';
import { toast } from '../components/toast.js';
import {
  MODES,
  PRESETS,
  getAppearance,
  setAppearance,
  resolveMode,
  presetById,
} from '../store/theme.js';

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */
export function renderAppearance() {
  const { mode, preset } = getAppearance();

  const modeOptions = MODES.map((m, i) => {
    const selected = m.id === mode;
    return `
      <button type="button" role="radio" class="seg ${
        selected ? 'is-selected' : ''
      }" data-mode="${m.id}" aria-checked="${selected}"
        tabindex="${selected ? '0' : '-1'}" aria-label="${m.label} theme">
        ${icon(m.icon, { size: 18 })}
        <span>${m.label}</span>
      </button>`;
  }).join('');

  const presetOptions = PRESETS.map((p) => {
    const selected = p.id === preset;
    return `
      <button type="button" role="radio" class="preset-card ${
        selected ? 'is-selected' : ''
      }" data-preset="${p.id}" aria-checked="${selected}"
        tabindex="${selected ? '0' : '-1'}"
        aria-label="${esc(p.name)} colour theme. ${esc(p.description)}">
        <span class="preset-card__swatches" aria-hidden="true">
          <span style="background:${p.swatch.primary}"></span>
          <span style="background:${p.swatch.accent}"></span>
          <span style="background:${p.swatch.surface}"></span>
        </span>
        <span class="preset-card__body">
          <span class="preset-card__name">${esc(p.name)}
            ${
              p.id === 'riverside'
                ? '<span class="badge badge--navy" style="margin-left:6px">Default</span>'
                : ''
            }
          </span>
          <span class="preset-card__desc">${esc(p.description)}</span>
        </span>
        <span class="preset-card__check" aria-hidden="true">${icon(
          'checkCircle',
          { size: 20 }
        )}</span>
      </button>`;
  }).join('');

  return `
    <div class="page">
      <div class="page__head">
        <div>
          <span class="eyebrow">Settings</span>
          <h1>Appearance</h1>
          <p>Choose a theme and colour palette. Your choice is saved to this
            browser and applied everywhere in the app.</p>
        </div>
      </div>

      <div class="appearance-grid">
        <div class="stack">
          <section class="card card--pad">
            <div class="card__head"><h3>${icon('sun')} Theme mode</h3></div>
            <p class="muted" style="margin:-8px 0 14px;font-size:.86rem">
              “System” follows your device setting automatically.
            </p>
            <div class="seg-group" role="radiogroup" aria-label="Theme mode"
              id="mode-group">
              ${modeOptions}
            </div>
          </section>

          <section class="card card--pad">
            <div class="card__head"><h3>${icon('palette')} Colour theme</h3></div>
            <p class="muted" style="margin:-8px 0 14px;font-size:.86rem">
              Six curated palettes, each tuned for WCAG AA contrast. Custom hex
              colours aren’t available, which keeps every theme readable.
            </p>
            <div class="preset-grid" role="radiogroup" aria-label="Colour theme"
              id="preset-group">
              ${presetOptions}
            </div>
          </section>
        </div>

        <aside class="appearance-preview-wrap">
          <section class="card card--pad" aria-live="polite">
            <div class="card__head">
              <h3>${icon('sparkles')} Preview</h3>
              <span class="badge" id="preview-meta">${previewMeta(
                preset,
                mode
              )}</span>
            </div>
            <div id="appearance-preview">${previewCard()}</div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function previewMeta(preset, mode) {
  const p = presetById(preset);
  const resolved = resolveMode(mode);
  return `${esc(p.name)} · ${resolved === 'dark' ? 'Dark' : 'Light'}`;
}

/** A compact preview: buttons, tags, a tutor card, and an agreement status. */
function previewCard() {
  return `
    <div class="preview">
      <div class="preview__row">
        <button type="button" class="btn btn--primary btn--sm" tabindex="-1">Primary</button>
        <button type="button" class="btn btn--ghost btn--sm" tabindex="-1">Secondary</button>
        <button type="button" class="btn btn--success btn--sm" tabindex="-1">Approve</button>
        <button type="button" class="btn btn--danger btn--sm" tabindex="-1">Decline</button>
      </div>

      <div class="preview__row">
        <span class="tag tag--teach">Calculus</span>
        <span class="tag tag--learn">Python</span>
        <span class="badge badge--amber">Pending</span>
        <span class="badge badge--green">Confirmed</span>
      </div>

      <div class="card preview__tutor">
        <div class="preview__tutor-top">
          <span class="avatar avatar--sm" style="background:var(--primary)">AO</span>
          <div style="min-width:0">
            <div class="preview__tutor-name">Amara Okafor</div>
            <div class="rating" style="font-size:.78rem">
              ${starFilled(13)} 4.9 <span class="muted" style="font-weight:500">(58)</span>
            </div>
          </div>
          <span class="price" style="margin-left:auto">$22<span class="price__unit">/hr</span></span>
        </div>
        <p class="preview__tutor-desc">Patient calculus tutor. Lots of worked
          examples, happy to swap for design help.</p>
        <div class="preview__tutor-foot">
          <button type="button" class="btn btn--ghost btn--sm" tabindex="-1">Profile</button>
          <button type="button" class="btn btn--primary btn--sm" style="flex:1" tabindex="-1">Request session</button>
        </div>
      </div>

      <div class="preview__agreement">
        <span class="preview__agreement-icon">${icon('handshake', {
          size: 16,
        })}</span>
        <div style="flex:1;min-width:0">
          <div class="preview__agreement-title">Session agreement</div>
          <div class="muted" style="font-size:.78rem">Linear Algebra · Thu 4:30 PM · $22</div>
        </div>
        <span class="badge badge--green badge--dot">Both approved</span>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Mount / interactions
 * ------------------------------------------------------------------ */
export function mountAppearance() {
  const view = document.getElementById('view');
  const modeGroup = view.querySelector('#mode-group');
  const presetGroup = view.querySelector('#preset-group');

  wireRadioGroup(modeGroup, '[data-mode]', (el) => {
    const next = setAppearance({ mode: el.dataset.mode });
    syncGroupSelection(modeGroup, '[data-mode]', el);
    refreshPreview(view, next);
    const resolved = resolveMode(next.mode);
    toast(
      `Theme mode: ${labelForMode(next.mode)}${
        next.mode === 'system' ? ` (now ${resolved})` : ''
      }.`,
      'info'
    );
  });

  wireRadioGroup(presetGroup, '[data-preset]', (el) => {
    const next = setAppearance({ preset: el.dataset.preset });
    syncGroupSelection(presetGroup, '[data-preset]', el);
    refreshPreview(view, next);
    toast(`Colour theme: ${presetById(next.preset).name}.`, 'success');
  });
}

function labelForMode(id) {
  return (MODES.find((m) => m.id === id) || {}).label || id;
}

function refreshPreview(view, appearance) {
  const meta = view.querySelector('#preview-meta');
  if (meta) meta.textContent = previewMeta(appearance.preset, appearance.mode);
  // The preview inherits tokens from <html>, so it restyles automatically;
  // nothing else to re-render.
}

/** Update aria-checked / selected class / roving tabindex within a group. */
function syncGroupSelection(group, selector, selectedEl) {
  group.querySelectorAll(selector).forEach((el) => {
    const on = el === selectedEl;
    el.classList.toggle('is-selected', on);
    el.setAttribute('aria-checked', String(on));
    el.tabIndex = on ? 0 : -1;
  });
}

/**
 * Wire a radiogroup of buttons: click to select, arrow keys to move the
 * selection (roving tabindex), Home/End for first/last. `onSelect(el)` fires
 * for both pointer and keyboard selection.
 */
function wireRadioGroup(group, selector, onSelect) {
  if (!group) return;
  const items = () => Array.from(group.querySelectorAll(selector));

  group.addEventListener('click', (e) => {
    const el = e.target.closest(selector);
    if (el) onSelect(el);
  });

  group.addEventListener('keydown', (e) => {
    const list = items();
    const current =
      document.activeElement.closest?.(selector) ||
      list.find((el) => el.getAttribute('aria-checked') === 'true') ||
      list[0];
    let idx = list.indexOf(current);
    let nextIdx = idx;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIdx = (idx + 1) % list.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIdx = (idx - 1 + list.length) % list.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = list.length - 1;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onSelect(current);
        return;
      default:
        return;
    }
    e.preventDefault();
    const target = list[nextIdx];
    target.focus();
    onSelect(target); // selection follows focus, standard radiogroup behaviour
  });
}
