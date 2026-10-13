/**
 * Refuse a completed frame when WebGL reports a graphics error. A hardware
 * device and HTTP success do not prove drawing succeeded: a sampler mismatch
 * can leave only the background. The caller finishes GPU commands first and
 * consumes one error reading before publishing the canvas bytes.
 */
export function assertHumanViewerFrame(error: number, noError: number): void {
  if (error !== noError)
    throw new Error("GPU drawing failed with WebGL error " + error);
}
