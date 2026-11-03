/** Clipboard APIs can be blocked in embedded browsers. Never report success unless a copy API succeeds. */
export async function copyChatLink(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const previous = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.setAttribute('aria-label', 'Invitation link to copy');
  Object.assign(field.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
  });
  document.body.appendChild(field);
  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    // Compatibility fallback for embedded browsers without Clipboard API access.
    // oxlint-disable-next-line typescript/no-deprecated
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    previous?.focus({ preventScroll: true });
  }
}
