import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "./admitHumanBodyBasisDocument";

/**
 * Serialize the last valid body document, keeping geometry in its basis.
 *
 * Document admission precedes JSON encoding so nonfinite scalars cannot silently become null. The final escaped text uses two-space indentation and the same UTF-16 size budget as loading. The supplied source authority is forwarded to admission but is not serialized into the document. This establishes a loadable text envelope and admitted document shape, not successful geometry, source availability or biological validity.
 *
 * @evidence contracts/common.md#principled-implementation Shared schema/scalar/source admission runs before JSON.stringify and the completed formatted string passes the same size admission as loading.
 * @evidence contracts/common.md#clear-and-simple-design One admitted document becomes one formatted edit string while geometry and source authority remain in their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite scalar loss and oversized saved envelopes refuse; a serializable record does not establish basis-dependent reach or geometry acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies two-space formatting, UTF-16 output budget, supplied source context and the limits of a successful save.
 * @evidence contracts/performance.md#efficient-algorithms Schema/scalar walks and formatted JSON work scale with document/output size; the output budget is checked after encoding and does not prevent its temporary allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Saving shares the parser's admission and text envelope rather than maintaining a separate accepted document schema.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string belongs to the caller; serialization retains no source mesh/context or prior document and owns no file handle or task.
 */
export function serializeHumanBodyBasisDocument(
  document: IAutoMovieHumanBodyBasisDocument,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const text: string = JSON.stringify(
    admitHumanBodyBasisDocument(document, source),
    null,
    2,
  );
  assertTextSize(text);
  return text;
}
