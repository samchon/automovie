/** Loading and saving share a UTF-16 envelope, including JSON whitespace.  * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads independent numerical edits while refusing unknown fields and invalid scalar values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits the compact document schema without changing its basis identity or supplied controls.
 * @author Samchon
 */
export function assertTextSize(text: string): void {
  if (text.length > 16 * 1024 * 1024)
    throw new Error(
      "Face documents must fit within 16,777,216 UTF-16 code units.",
    );
}
