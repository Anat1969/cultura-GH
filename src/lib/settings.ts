/**
 * Provider keys the user pastes in the settings screen.
 *
 * They live in this browser's localStorage, on this device only: they are never
 * sent anywhere except to the provider whose key it is, and they are not part of
 * the deployed site. Clearing site data removes them.
 */

const ANTHROPIC_KEY = 'culturearch_anthropic_key';
const IMAGE_KEY = 'culturearch_fal_key';
const GITHUB_KEY = 'culturearch_github_token';
const PASSCODE_KEY = 'culturearch_passcode';

/**
 * Copying a key out of a web console can bring along a line break, a stray
 * space or a zero-width character. None of them belong to the key, and all of
 * them would otherwise make it fail, so they are removed rather than rejected.
 */
export function normalizeKey(value: string): string {
  return value.replace(/[\s\u200b-\u200d\ufeff]/g, '');
}

function read(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? '';
  } catch {
    return '';
  }
}

/**
 * Writes, then reads back to confirm it actually persisted. Storage can be
 * blocked or silently discarded, and telling someone their key is saved when it
 * is not sends them round the same loop forever.
 */
function write(key: string, value: string): boolean {
  const v = normalizeKey(value);
  try {
    if (v) {
      localStorage.setItem(key, v);
      return localStorage.getItem(key) === v;
    }
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const getAnthropicKey = () => read(ANTHROPIC_KEY);
export const setAnthropicKey = (v: string) => write(ANTHROPIC_KEY, v);
export const hasAnthropicKey = () => getAnthropicKey().length > 0;

export const getGithubToken = () => read(GITHUB_KEY);
export const setGithubToken = (v: string) => write(GITHUB_KEY, v);
export const hasGithubToken = () => getGithubToken().length > 0;

/**
 * Only needed when APP_PASSCODE is set on the Edge Functions, which is how a
 * public site stops strangers from spending the account's credits.
 */
export const getPasscode = () => read(PASSCODE_KEY);
export const setPasscode = (v: string) => write(PASSCODE_KEY, v);
export const hasPasscode = () => getPasscode().length > 0;

export const getImageKey = () => read(IMAGE_KEY);
export const setImageKey = (v: string) => write(IMAGE_KEY, v);
export const hasImageKey = () => getImageKey().length > 0;

/**
 * Advisory only. Anthropic keys normally start with `sk-ant-`, but this must
 * never block a save: the key belongs to the user, and only the API can really
 * say whether it works.
 */
export function looksLikeAnthropicKey(value: string): boolean {
  return /^sk-ant-/.test(normalizeKey(value));
}

/** Masked form for display, so a saved key is recognisable but not readable. */
export function maskKey(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return '••••';
  return `${v.slice(0, 10)}…${v.slice(-4)}`;
}
