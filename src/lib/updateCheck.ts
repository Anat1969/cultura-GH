/**
 * GitHub Pages serves index.html with a ten-minute cache, so for that long a
 * refresh keeps handing back the previous build and a change looks like it
 * never shipped. Nothing 404s, so the boot recovery cannot help either.
 *
 * The published version.json names the bundle of the newest deploy. If the
 * bundle running here is not that one, this page came from cache: fetch
 * index.html again past the cache, once.
 */

const RELOAD_MARKER = 'culturearch_reloaded_for';

/** The chunk this module was bundled into, hash and all. */
function runningBundle(): string {
  try {
    return import.meta.url.split('/').pop() ?? '';
  } catch {
    return '';
  }
}

async function checkOnce(): Promise<void> {
  const running = runningBundle();
  if (!running) return;

  let published: string | undefined;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' });
    if (!response.ok) return;
    published = (await response.json())?.bundle;
  } catch {
    // Offline or blocked: carry on with what is already loaded.
    return;
  }

  if (!published || published === running) return;

  // One reload per new build, so a mismatch that survives it cannot loop.
  try {
    if (sessionStorage.getItem(RELOAD_MARKER) === published) return;
    sessionStorage.setItem(RELOAD_MARKER, published);
  } catch {
    return;
  }

  window.location.replace(`${window.location.pathname}?v=${Date.now()}${window.location.hash}`);
}

export function installUpdateCheck(): void {
  if (typeof window === 'undefined') return;
  void checkOnce();
  // A tab left open for days should not keep running last week's build.
  window.addEventListener('focus', () => void checkOnce());
}
