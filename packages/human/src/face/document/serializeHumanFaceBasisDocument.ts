import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admitHumanFaceBasisDocument } from "./admitHumanFaceBasisDocument";
import { assertTextSize } from "../../common/document/assertTextSize";

/**
 * Serialize the last valid document, keeping geometry in its immutable basis.
 * Admission occurs before JSON can convert a nonfinite number to null.
 */
export function serializeHumanFaceBasisDocument(
  document: IAutoMovieHumanFaceBasisDocument,
): string {
  const text = JSON.stringify(admitHumanFaceBasisDocument(document), null, 2);
  // Measure the actual escaped, formatted representation. Otherwise a valid
  // in-memory edit could save successfully but exceed the loader's envelope.
  assertTextSize(text);
  return text;
}
