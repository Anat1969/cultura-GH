/**
 * Every screen animates its content in from opacity 0 with framer-motion, which
 * drives those animations from requestAnimationFrame. Where rAF never fires -
 * occluded or background windows, remote desktops, VMs and GPU-less rendering -
 * the fade never runs and the whole app stays invisible: a black screen.
 *
 * This watches for that and hands over to a CSS rule that forces the final,
 * visible state. Animation becomes an enhancement rather than a precondition
 * for seeing the app at all.
 */

const FALLBACK_CLASS = 'motion-fallback';

/** Animations are gone for good; show everything in its settled state. */
function reveal(): void {
  document.documentElement.classList.add(FALLBACK_CLASS);
}

/** True when a motion element is still mostly transparent long after load. */
function stillInvisible(): boolean {
  const animated = document.querySelectorAll<HTMLElement>('#root [style*="opacity"]');
  for (const el of animated) {
    if (Number(getComputedStyle(el).opacity) < 0.9) return true;
  }
  return false;
}

export function installMotionFallback(): void {
  if (typeof window === 'undefined') return;

  // Cause: no animation frame at all within half a second of boot.
  let sawFrame = false;
  window.requestAnimationFrame(() => {
    sawFrame = true;
  });
  window.setTimeout(() => {
    if (!sawFrame) reveal();
  }, 500);

  // Symptom: frames may run but stall part-way, which looks the same to a
  // reader. Checked once the longest entry animation should have settled.
  window.setTimeout(() => {
    if (stillInvisible()) reveal();
  }, 2500);
}
