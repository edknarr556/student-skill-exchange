/**
 * Minimal hash-based router. Routes are registered as patterns with optional
 * `:param` segments. The matched render function receives (params, query).
 */
const routes = [];
let notFound = () => '<div class="page"><h1>Not found</h1></div>';
let onChange = null;

export function registerRoutes(defs) {
  defs.forEach(({ path, render }) => {
    routes.push({ parts: path.split('/').filter(Boolean), render, path });
  });
}

export function setNotFound(fn) {
  notFound = fn;
}

export function onRouteChange(fn) {
  onChange = fn;
}

export function currentPath() {
  const hash = window.location.hash.slice(1) || '/';
  return hash.split('?')[0] || '/';
}

export function navigate(path) {
  if (('#' + path) === window.location.hash) {
    handle(); // force re-render if navigating to same route
  } else {
    window.location.hash = path;
  }
}

function parseQuery(hash) {
  const qIndex = hash.indexOf('?');
  const query = {};
  if (qIndex !== -1) {
    new URLSearchParams(hash.slice(qIndex + 1)).forEach((v, k) => {
      query[k] = v;
    });
  }
  return query;
}

function match(pathParts) {
  for (const route of routes) {
    if (route.parts.length !== pathParts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < route.parts.length; i++) {
      const rp = route.parts[i];
      const pp = pathParts[i];
      if (rp.startsWith(':')) params[rp.slice(1)] = decodeURIComponent(pp);
      else if (rp !== pp) {
        ok = false;
        break;
      }
    }
    if (ok) return { route, params };
  }
  return null;
}

function handle() {
  const hash = window.location.hash.slice(1) || '/';
  const path = hash.split('?')[0] || '/';
  const query = parseQuery(hash);
  const parts = path.split('/').filter(Boolean);

  const matched = match(parts);
  const html = matched
    ? matched.route.render(matched.params, query)
    : notFound();

  if (onChange) onChange({ path, html, params: matched?.params || {}, query });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

export function startRouter() {
  window.addEventListener('hashchange', handle);
  if (!window.location.hash) window.location.hash = '/';
  else handle();
}
