/**
 * Hand bytes to the browser as a file download under a name and media type.
 * The object URL is revoked shortly after the click, once the browser has
 * taken the bytes.
 *
 * @author Samchon
 */
export function downloadConnectedFile(filename: string, bytes: BlobPart, mime: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
