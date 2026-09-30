import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";

/**
 * Serialize the last valid body document, keeping geometry in its basis.
 *
 * Admission happens before JSON can convert a nonfinite number to null, and
 * the escaped, formatted text is measured against the loader's envelope so a
 * valid in-memory edit cannot save into something the loader refuses.
 */
export function serializeHumanBodyBasisDocument(
  document: IAutoMovieHumanBodyBasisDocument,
): string {
  const text = JSON.stringify(admitHumanBodyBasisDocument(document), null, 2);
  assertTextSize(text);
  return text;
}
