/**
 * Refuse a document text longer than the shared envelope, in UTF-16 code units
 * and including JSON whitespace. Loading and saving, for the face and the body
 * alike, share this one limit so a document that can be saved can be loaded.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads independent numerical edits while refusing unknown fields and invalid scalar values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits the compact document schema without changing its basis identity or supplied controls.
 * @author Samchon
 */
export function assertTextSize(text: string): void {
  if (text.length > 16 * 1024 * 1024)
    throw new Error("Documents must fit within 16,777,216 UTF-16 code units.");
}
