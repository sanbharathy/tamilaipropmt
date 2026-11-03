/** Resize on the device; the authenticated server still validates and strips metadata. */
export async function compressChatImage(file: File): Promise<File> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 20 * 1024 * 1024
  )
    throw new Error('Choose a JPG, PNG or WebP photo under 20 MB.');
  const url = URL.createObjectURL(file);
  let bitmap: ImageBitmap | undefined;
  try {
    let source: CanvasImageSource;
    let width: number, height: number;
    try {
      bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    } catch {
      const image = new Image();
      image.src = url;
      await image.decode();
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
    }
    if (!width || !height || width * height > 80_000_000)
      throw new Error(
        'This photo is too large to process. Choose a smaller photo.',
      );
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1200 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('Photo processing is unavailable in this browser.');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (let attempt = 0; attempt < 5; attempt++) {
      for (const quality of [0.82, 0.66, 0.5, 0.38]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', quality),
        );
        if (!blob)
          throw new Error(
            'Unable to process this photo. Try a different picture.',
          );
        if (blob.size <= 400 * 1024)
          return new File(
            [blob],
            blob.type === 'image/webp' ? 'chat-photo.webp' : 'chat-photo.png',
            { type: blob.type },
          );
      }
      const smaller = document.createElement('canvas');
      smaller.width = Math.max(1, Math.round(canvas.width * 0.75));
      smaller.height = Math.max(1, Math.round(canvas.height * 0.75));
      smaller
        .getContext('2d')!
        .drawImage(canvas, 0, 0, smaller.width, smaller.height);
      canvas.width = smaller.width;
      canvas.height = smaller.height;
      context.drawImage(smaller, 0, 0);
    }
    throw new Error(
      'Unable to reduce this photo. Please choose a smaller image.',
    );
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(url);
  }
}
