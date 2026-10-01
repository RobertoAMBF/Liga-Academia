const storageKey = "liga-pending-invite";

export function normalizeInvite(value: string | null): string | null {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z0-9]{1,32}$/.test(code) ? code : null;
}

export function pendingInvite(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.has("invite")) {
    const code = normalizeInvite(params.get("invite"));
    try {
      if (code) window.localStorage.setItem(storageKey, code);
      else window.localStorage.removeItem(storageKey);
    } catch {}
    return code;
  }
  try {
    return normalizeInvite(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function clearInvite() {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState(window.history.state, "", url);
}

export function inviteLink(origin: string, code: string): string {
  const url = new URL("/", origin);
  url.searchParams.set("invite", code);
  return url.toString();
}
