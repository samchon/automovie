/**
 * Refuse a completed frame when WebGL reports a graphics error. A hardware device and HTTP success do not prove drawing succeeded: a sampler mismatch can leave only the background. The caller finishes GPU commands first and consumes one error reading before publishing the canvas bytes.
 *
 * @evidence contracts/common.md#principled-implementation The consumed WebGL error enum is compared with that context's NO_ERROR value; any other code refuses capture with the original numeric graphics cause.
 * @evidence contracts/common.md#clear-and-simple-design A single boundary check separates GPU-command completion from publishing canvas bytes, without duplicating renderer setup or hardware admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hardware availability and HTTP success do not override a graphics error or certify that model pixels were drawn.
 * @evidence contracts/common.md#meaningful-documentation The prose explains finish-before-reading order, consumed-error semantics and refusal before canvas publication.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One enum comparison and conditional error construction select no traversal or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work WebGL error reads are consumed context state and cannot be reused as authority for later frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard owns no GPU object or error queue; its caller supplies the consumed numeric reading and retains renderer ownership.
 */
export function assertHumanViewerFrame(error: number, noError: number): void {
  if (error !== noError)
    throw new Error("GPU drawing failed with WebGL error " + error);
}
