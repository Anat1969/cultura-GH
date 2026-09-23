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

function read(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  try {
    const v = value.trim();
    if (v) localStorage.setItem(key, v);
    else localStorage.removeItem(key);
  } catch {
    // Private mode or blocked storage: the key simply does not persist.
  }
}

export const getAnthropicKey = () => read(ANTHROPIC_KEY);
export const setAnthropicKey = (v: string) => write(ANTHROPIC_KEY, v);
export const hasAnthropicKey = () => getAnthropicKey().length > 0;

export const getGithubToken = () => read(GITHUB_KEY);
export const setGithubToken = (v: string) => write(GITHUB_KEY, v);
export const hasGithubToken = () => getGithubToken().length > 0;

export const getImageKey = () => read(IMAGE_KEY);
export const setImageKey = (v: string) => write(IMAGE_KEY, v);
export const hasImageKey = () => getImageKey().length > 0;

/** Anthropic keys start with `sk-ant-`; catches a mis-paste before a request. */
export function looksLikeAnthropicKey(value: string): boolean {
  return /^sk-ant-\S{20,}$/.test(value.trim());
}

/** Masked form for display, so a saved key is recognisable but not readable. */
export function maskKey(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return '••••';
  return `${v.slice(0, 10)}…${v.slice(-4)}`;
}
