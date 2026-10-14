import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Revision is read before manifest; both fields update only after both reads succeed.
 * @evidence contracts/common.md#clear-and-simple-design Refreshes resident clock and asset mirror in one ordered operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential observations are not atomic; preassignment failure preserves old fields.
 * @evidence contracts/common.md#meaningful-documentation States observation and assignment order.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete revision/manifest reads and path admission.
 * @evidence contracts/performance.md#reuse-equivalent-work New observations replace old mirrors; equal revision does not suppress manifest reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the manifest until refresh/collection; readers close handles.
 */
export function autoMovieProjectSynchronizeResidentState(_project: IAutoMovieProjectState): void {
    const revision: number = _project.readRevision();
    const manifest: IAutoMovieProjectManifest = _project.readManifest();
    _project.lastReadRevision_ = revision;
    _project.manifest = manifest;
}
