import { assertTextSize } from "../../face/document/assertTextSize";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";

/**
 * Load compact body edits without resolving an asset or photograph.
 *
 * The text envelope is the face's (16,777,216 UTF-16 code units) so both
 * editors share one loader budget; schema and finite-number admission precede
 * any worker allocation in the browser. The compiled basis separately owns
 * channel names, ranges, joints and model admission.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Loads a saved body document from text alone and refuses a malformed one before it reaches a basis.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Applies the shared UTF-16 envelope and the parse-time admission the save boundary defines.
 */
export function parseHumanBodyBasisDocument(
  text: string,
): IAutoMovieHumanBodyBasisDocument {
  assertTextSize(text);
  return admitHumanBodyBasisDocument(JSON.parse(text));
}
