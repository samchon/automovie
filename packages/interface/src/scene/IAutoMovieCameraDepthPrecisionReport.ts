/**
 * Addressed deterministic depth-precision result for one realized camera time.
 *
 * Nullable numeric operands make even malformed non-finite input serializable:
 * a finite invalid value is retained, while `NaN` and infinities become null.
 * Measurement fields remain null until the clip, required range, capability,
 * and threshold are all valid and the required range is inside the clip range.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Reports the exact camera, time, required depth interval, buffer capability, metre-valued threshold, and measured boundary used for acceptance.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the addressed output of the specified required-range depth precision evaluation.
 * @author Samchon
 */
export interface IAutoMovieCameraDepthPrecisionReport {
  /** Scene camera identity evaluated. */
  camera: string;

  /** Shot-local sample time, or null when the input time was non-finite. */
  time: number | null;

  /** Exact metric identity. */
  metric: "maximum-adjacent-depth-step";

  /** Unit of clip, required-range, threshold, and measurement values. */
  unit: "meters";

  /** Positive near clip distance, or the finite invalid value/null observed. */
  near: number | null;

  /** Ordered far clip distance, or the finite invalid value/null observed. */
  far: number | null;

  /** Nearest required camera-space depth, or null for invalid input. */
  requiredNear: number | null;

  /** Farthest required camera-space depth, or null for invalid input. */
  requiredFar: number | null;

  /** Authored minimum depth bits, or null when non-finite. */
  minimumDepthBits: number | null;

  /** Authored accepted adjacent step, or null when non-finite. */
  maximumStepMeters: number | null;

  /** Lower fixed-point code of the measured far-end cell. */
  lowerCode: number | null;

  /** Upper fixed-point code of the measured far-end cell. */
  upperCode: number | null;

  /** Measured adjacent eye-space step in metres. */
  measuredStepMeters: number | null;

  /** Closed outcome classification. */
  status:
    | "satisfied"
    | "outside-clipping-range"
    | "insufficient-precision"
    | "invalid";

  /** Whether every input and the measured precision meet the declaration. */
  passed: boolean;
}
