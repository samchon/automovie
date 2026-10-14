import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";

/**
 * Load compact body edits without resolving an asset or photograph.
 *
 * The face and body share a 16,777,216 UTF-16 code-unit input budget. JSON parsing and document schema/scalar admission happen here; the compiled basis separately owns channel names, ranges, joints and resident-model admission. Optional loaded source authority is supplied by the host rather than deserialized from personal data. This synchronous parser acquires no worker and does not certify biological or visual validity.
 *
 * @evidence contracts/common.md#principled-implementation The shared text-size admission precedes JSON parsing, then the same exact-schema/scalar/source-context owner used by saving admits the body document.
 * @evidence contracts/common.md#clear-and-simple-design Text envelope, JSON decoding and semantic document admission remain three explicit operations without resolving an asset or photograph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed/oversized text and inadmissible records throw rather than dropping legacy fields; basis-dependent reach and clinical/visual validity remain outside parsing.
 * @evidence contracts/common.md#meaningful-documentation The prose states UTF-16 budget units, synchronous ownership, host-supplied source authority and separate compiled-basis decisions.
 * @evidence contracts/performance.md#efficient-algorithms Size admission uses string length, then JSON decoding and scalar/schema walks follow text/record size bounded at the input envelope.
 * @evidence contracts/performance.md#reuse-equivalent-work Loading and saving reuse the same text budget and document admission owners instead of diverging schema or source rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the parsed admitted record escapes; the parser retains no source authority cache, worker, file handle or background task.
 */
export function parseHumanBodyBasisDocument(
  text: string,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanBodyBasisDocument {
  assertTextSize(text);
  return admitHumanBodyBasisDocument(JSON.parse(text), source);
}
