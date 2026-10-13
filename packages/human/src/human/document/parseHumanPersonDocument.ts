import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Parse person JSON within the shared 16,777,216 UTF-16-code-unit envelope, including whitespace, then apply exact person and anatomy subtree admission with optional host-owned body source authority. This bounds parser text, not all downstream allocations or source geometry. Input text remains unchanged and the admitted parsed object belongs to the caller; JSON syntax/admission failures propagate.
 *
 * @evidence contracts/common.md#principled-implementation The shared text envelope precedes JSON allocation, then the person admission owner validates the parsed record and any explicit loaded-source neutral restrictions.
 * @evidence contracts/common.md#clear-and-simple-design One loader composes shared size and record admission rather than inventing a separate schema or source evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Oversize/malformed/unsupported records refuse without truncation or defaults; parsed storage validity establishes no available generation, anatomy or viewer result.
 * @evidence contracts/common.md#meaningful-documentation Prose states UTF-16 units, whitespace, admission order, body-source authority and actual allocation scope.
 * @evidence contracts/performance.md#efficient-algorithms Stored string length is constant-time checked; JSON parsing and schema/subtree traversal follow actual bounded text/record populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every supplied string/source pair is admitted anew; the loader owns no parsed-document cache or asynchronous request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed records and error diagnostics follow caller/error lifetime; the loader retains no text, source handle or running worker.
 */
export function parseHumanPersonDocument(
  text: string,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanPersonDocument {
  assertTextSize(text);
  return admitHumanPersonDocument(JSON.parse(text), bodySource);
}
