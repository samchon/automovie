/**
 * Refuse a document text longer than the shared envelope, in UTF-16 code units
 * and including JSON whitespace. Loading and saving, for the face and the body
 * alike, share this one limit so a document that can be saved can be loaded.
 *
 * @author Samchon
 */
export function assertTextSize(text: string): void {
  if (text.length > 16 * 1024 * 1024)
    throw new Error("Documents must fit within 16,777,216 UTF-16 code units.");
}
