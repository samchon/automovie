/**
 * Geometry-revision and fixed-clock authority supplied by the builder.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Binds one clearance evaluation to the geometry revision read and the revision still current.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the deterministic clock and freshness authority used before a take is admitted.
 */
export interface IAutoMovieCameraClearanceRuntime {
  /**
   * Revision from which staged models were materialized.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Identifies the exact staged geometry snapshot inspected.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Names the staged geometry snapshot the evaluation measured, which is the value the gate compares against the one still current.
   */
  revision: string;
  /**
   * Revision still current at the performance gate.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Prevents a stale measured snapshot from being accepted as current.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the revision freshness comparison.
   */
  currentRevision: string;
  /**
   * Fixed-clock inspection samples per second.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-dynamic-spatial-sampling Declares the endpoint-inclusive inspection clock.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Supplies the deterministic path gate sample rate.
   */
  sampleRate: number;
}
