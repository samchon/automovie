import { assertTextSize } from "../../face/document/assertTextSize";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";

/**
 * Serialize the last valid body document, keeping geometry in its basis.
 *
 * Admission happens before JSON can convert a nonfinite number to null, and
 * the escaped, formatted text is measured against the loader's envelope so a
 * valid in-memory edit cannot save into something the loader refuses.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Saves only an admitted document and never one the loader would refuse.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Runs the same admission as loading and measures the serialized text against the shared envelope.
 */
export function serializeHumanBodyBasisDocument(
  document: IAutoMovieHumanBodyBasisDocument,
): string {
  const text = JSON.stringify(admitHumanBodyBasisDocument(document), null, 2);
  assertTextSize(text);
  return text;
}
