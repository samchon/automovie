/**
 * Refuse a completed frame when WebGL reports a graphics error. A hardware
 * device and HTTP success do not prove drawing succeeded: a sampler mismatch
 * can leave only the background. The caller finishes GPU commands first and
 * consumes one error reading before publishing the canvas bytes.
 *
 * @evidence contracts/common.md#principled-implementation Compares the completed graphics command stream's error reading with its explicit no-error value before image publication.
 * @evidence contracts/common.md#clear-and-simple-design Graphics admission owns one observable check and no camera or document state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses the actual device error without replacing renderer methods or recognizing images specially.
 * @evidence contracts/common.md#meaningful-documentation Explains why successful transport and device selection are insufficient evidence of drawing.
 */
export function assertHumanViewerFrame(error: number, noError: number): void {
  if (error !== noError) throw new Error("GPU drawing failed with WebGL error " + error);
}
