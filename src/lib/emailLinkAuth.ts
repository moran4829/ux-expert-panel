const EMAIL_KEY = 'podium_emailForSignIn';
const DISPLAY_NAME_KEY = 'podium_displayNameForSignIn';

export function storeEmailForSignIn(email: string, displayName?: string) {
  window.localStorage.setItem(EMAIL_KEY, email.trim());
  if (displayName?.trim()) {
    window.localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
  } else {
    window.localStorage.removeItem(DISPLAY_NAME_KEY);
  }
}

export function readEmailForSignIn(): string | null {
  return window.localStorage.getItem(EMAIL_KEY);
}

export function readDisplayNameForSignIn(): string | null {
  return window.localStorage.getItem(DISPLAY_NAME_KEY);
}

export function clearEmailLinkStorage() {
  window.localStorage.removeItem(EMAIL_KEY);
  window.localStorage.removeItem(DISPLAY_NAME_KEY);
}

export function getEmailLinkActionCodeSettings() {
  return {
    url: `${window.location.origin}${window.location.pathname}`,
    handleCodeInApp: true,
  };
}

export function cleanEmailLinkFromUrl() {
  const url = new URL(window.location.href);
  for (const key of ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl']) {
    url.searchParams.delete(key);
  }
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '');
  window.history.replaceState({}, document.title, next);
}

export function hasEmailLinkParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('oobCode') && params.get('mode') === 'signIn';
}
