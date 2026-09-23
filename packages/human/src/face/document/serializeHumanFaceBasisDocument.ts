import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admit } from "./admit";
import { assertTextSize } from "./assertTextSize";

/**
 * Serialize the last valid document, keeping geometry in its immutable basis.
 * Admission occurs before JSON can convert a nonfinite number to null.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Saves replayable shape, expression and material edits independently of source geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Preserves the exact basis revision and finite authored values on save.
 */
export function serializeHumanFaceBasisDocument(
  document: IAutoMovieHumanFaceBasisDocument,
): string {
  const text = JSON.stringify(admit(document), null, 2);
  // Measure the actual escaped, formatted representation. Otherwise a valid
  // in-memory edit could save successfully but exceed the loader's envelope.
  assertTextSize(text);
  return text;
}
