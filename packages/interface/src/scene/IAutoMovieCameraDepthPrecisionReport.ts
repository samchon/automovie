/**
 * Addressed deterministic depth-precision result for one realized camera time.
 *
 * Nullable numeric operands make even malformed non-finite input serializable: a finite invalid value is retained, while `NaN` and infinities become null. Measurement fields remain null until the clip, required range, capability, and threshold are all valid and the required range is inside the clip range.
 *
 * @evidence contracts/common.md#principled-implementation The evaluator inverts the standard depth codes bracketing requiredFar, where adjacent step is largest, and records exact operands and result; near-only range has zero step and floating code-boundary rounding may select a neighbouring cell.
 * @evidence contracts/common.md#clear-and-simple-design Serializable input echoes and nullable measured fields distinguish malformed input, clipping refusal and inadequate precision from a satisfied metric.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite operands become null and never clamp into success; measured values remain absent until every range, capability and threshold premise holds.
 * @evidence contracts/common.md#meaningful-documentation Defines camera/time ownership, meter units, echoed invalid operands, code pair, measured step and the four outcomes with passed only for satisfaction.
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
