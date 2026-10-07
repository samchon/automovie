/** The existing signed-surface validator's result on one actual contact surface. */
export interface IUpperLimbSignedSurfaceObservation {
  /** Constructed query, validator refusal or no selected triangle population. */
  status: "admitted" | "refused" | "unavailable";

  /** Oriented faces submitted to that exact validator invocation. */
  triangles: number;

  /** Actual refusal or unavailable reason; admission asserts no contact quality. */
  reason: string | null;

  /** Query construction cost, without a performance acceptance threshold. */
  milliseconds: number;
}
