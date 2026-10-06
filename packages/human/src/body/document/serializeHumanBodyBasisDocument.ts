import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

/**
 * Serialize the last valid body document, keeping geometry in its basis.
 *
 * Admission happens before JSON can convert a nonfinite number to null, and
 * the escaped, formatted text is measured against the loader's envelope so a
 * valid in-memory edit cannot save into something the loader refuses.
 * Optional loaded source authority is forwarded to the same admission used
 * during parsing; no source mesh, field or context is serialized into edits.
 */
export function serializeHumanBodyBasisDocument(
  document: IAutoMovieHumanBodyBasisDocument,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const text = JSON.stringify(admitHumanBodyBasisDocument(document, source), null, 2);
  assertTextSize(text);
  return text;
}
