'use client';
type SaveResult = { saved?: boolean; cancelled?: boolean; started?: boolean };
type ImageBridge = {
  postMessage: (message: string) => void;
  onmessage?: (event: { data: string }) => void;
};
export async function downloadChatImage(blob: Blob): Promise<SaveResult> {
  const bridge = (window as unknown as { TaieImageDownload?: ImageBridge })
    .TaieImageDownload;
  if (bridge) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(
          typeof reader.result === 'string' ? reader.result.split(',')[1] : '',
        );
      reader.onerror = () => reject(Error('Could not prepare image.'));
      reader.readAsDataURL(blob);
    });
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const previous = bridge.onmessage;
      const timer = window.setTimeout(() => {
        bridge.onmessage = previous;
        reject(Error('Saving timed out. Please try again.'));
      }, 300000);
      bridge.onmessage = (event) => {
        let result;
        try {
          result = JSON.parse(event.data);
        } catch {
          return;
        }
        if (result.id !== id) {
          previous?.(event);
          return;
        }
        clearTimeout(timer);
        bridge.onmessage = previous;
        if (result.error) reject(Error(result.error));
        else resolve(result);
      };
      try {
        bridge.postMessage(JSON.stringify({ id, data }));
      } catch {
        clearTimeout(timer);
        bridge.onmessage = previous;
        reject(Error('Could not open the save picker.'));
      }
    });
  }
  if (navigator.userAgent.includes('TAIE-App'))
    throw Error('Install the latest TAIE APK to save images from chat.');
  const ext =
    blob.type === 'image/gif'
      ? 'gif'
      : blob.type === 'image/webp'
        ? 'webp'
        : blob.type === 'image/jpeg'
          ? 'jpg'
          : 'png';
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = `TAIE-chat-${Date.now()}.${ext}`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { started: true };
}
