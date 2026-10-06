import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

/**
 * Load compact body edits without resolving an asset or photograph.
 *
 * The text envelope is the face's (16,777,216 UTF-16 code units) so both
 * editors share one loader budget; schema and finite-number admission precede
 * any worker allocation in the browser. The compiled basis separately owns
 * channel names, ranges, joints and model admission.
 * Optional loaded source authority admits only its actual registered quantity
 * paths; it is supplied by the host, never deserialized from personal data.
 */
export function parseHumanBodyBasisDocument(
  text: string,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanBodyBasisDocument {
  assertTextSize(text);
  return admitHumanBodyBasisDocument(JSON.parse(text), source);
}
