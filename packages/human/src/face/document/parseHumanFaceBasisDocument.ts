import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admitHumanFaceBasisDocument } from "./admitHumanFaceBasisDocument";

/**
 * Load compact connected-basis edits without resolving an asset or photograph.
 * Schema and finite-number admission precede worker allocation in the browser.
 * The compiled basis separately owns channel names, ranges and model admission.
 *
 * @evidence contracts/common.md#principled-implementation The shared text envelope precedes JSON parsing and exact-schema/profile/finite admission. Loading compact edits needs no asset/photo; actual compiled channel domains and model geometry are checked later by their owners.
 * @evidence contracts/common.md#clear-and-simple-design One parser composes size, standard JSON and the shared load/save document boundary without a second schema or geometry loader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Oversize, invalid JSON or inadmissible fields propagate refusals; no unknown field, missing source or nonfinite value is repaired with defaults/presets.
 * @evidence contracts/common.md#meaningful-documentation Prose separates compact edit loading from asset resolution and later channel/model admission; returned JSON data is newly parsed caller-owned data.
 * @evidence contracts/performance.md#efficient-algorithms Stored UTF-16 string length is checked in constant time; JSON/schema scans follow text/field populations plus delegated profile admission. The accepted code-unit envelope does not make nested profile work constant.
 * @evidence contracts/performance.md#reuse-equivalent-work Admission is shared with serialization; each distinct text is parsed once in this call and no asset or result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed document ownership transfers; text and temporary admission arrays are local, with no worker, file handle or retained request history.
 */
export function parseHumanFaceBasisDocument(
  text: string,
): IAutoMovieHumanFaceBasisDocument {
  assertTextSize(text);
  return admitHumanFaceBasisDocument(JSON.parse(text));
}
