import {
  IAutoMovieCameraDepthPrecisionConstraint,
  IAutoMovieCameraDepthPrecisionReport,
} from "@automovie/interface";

/** A number as the report carries it: itself when finite, else null. */
function finiteOrNull (value: number): number | null { return Number.isFinite(value) ? value : null; }

/**
 * Measure the largest gap between adjacent representable depths that a camera's standard perspective depth buffer leaves inside one required camera-space range, and judge it against an authored maximum.
 *
 * With `levels = 2^bits - 1`, a depth `z` lies at `q(z) * levels` in code units, where `q(z) = (1/near - 1/z) / (1/near - 1/far)`, and the code `k` decodes to `1 / (1/near - (k/levels) * (1/near - 1/far))`. The gap between adjacent codes grows with depth, so the widest cell the closed range `[requiredNear, requiredFar]` touches is the one ending at, or containing, `requiredFar`: codes `ceil(q(requiredFar) * levels) - 1` and that ceiling. A range that ends exactly on `near` needs only code 0, which decodes exactly, so it reports codes 0 and 0 and a step of 0.
 *
 * The report echoes every input, with a non-finite number as null, and its `status` is `invalid` for a blank camera, a negative or non-finite time, a clip range that is not `0 < near < far` and finite, an inverted or non-finite required range, a bit depth that is not a positive integer whose level count is a safe integer, a maximum step that is not finite and positive, or a step that does not evaluate to a finite non-negative number; `outside-clipping-range` when the required range leaves `[near, far]`; and otherwise `satisfied` when the step is at most the maximum, equality included, else `insufficient-precision`. Only `satisfied` sets `passed`.
 *
 * @evidence contracts/common.md#principled-implementation Uses the standard perspective depth mapping, linear in `1/z`, and the inverse formula at integer codes; monotonic growth of decoded spacing identifies the farthest touched cell under exact-real arithmetic. Binary64 reciprocal/subtraction rounding can select a neighbouring cell or make derived arithmetic invalid; this report is not a certified floating-point error bound.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from a camera's clip range, a required range and a constraint to a serializable report; both depth-precision paths in `realizeShotContract` call it, so the formula and its refusals live in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no camera or scene; malformed input becomes an `invalid` report with null measurements rather than a clamped guess, and the degenerate point on `near` reports its exact zero step instead of borrowing the following cell.
 * @evidence contracts/common.md#meaningful-documentation States the depth mapping, the decoding, which cell is measured and why, the degenerate near case, how inputs are echoed, every status and its condition, the inclusive threshold, and metre units through the report's `unit`.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one normalized depth, one ceiling and two decodes, with no search over codes because monotonic spacing identifies the worst cell directly.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of the current camera range and constraint; it coordinates no requests or effects and retains no map across mutable camera samples.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned report is a fresh record owned by the caller.
 */
export function evaluateAutoMovieCameraDepthPrecision (props: {
  /** Stable scene camera identity, non-blank. */
  camera: string;

  /** Shot-local sample time in seconds, finite and non-negative. */
  time: number;

  /** Near clip distance in metres, finite and positive. */
  near: number;

  /** Far clip distance in metres, finite and beyond `near`. */
  far: number;

  /** Nearest camera-space depth the shot needs resolved, in metres. */
  requiredNear: number;

  /** Farthest camera-space depth the shot needs resolved, in metres. */
  requiredFar: number;

  /** Authored depth-buffer bits and largest allowed adjacent step. */
  constraint: IAutoMovieCameraDepthPrecisionConstraint;
}): IAutoMovieCameraDepthPrecisionReport {
  const base: Omit<
    IAutoMovieCameraDepthPrecisionReport,
    "lowerCode" | "upperCode" | "measuredStepMeters" | "status" | "passed"
  > = {
    camera: props.camera,
    time: finiteOrNull(props.time),
    metric: "maximum-adjacent-depth-step",
    unit: "meters",
    near: finiteOrNull(props.near),
    far: finiteOrNull(props.far),
    requiredNear: finiteOrNull(props.requiredNear),
    requiredFar: finiteOrNull(props.requiredFar),
    minimumDepthBits: finiteOrNull(props.constraint.minimumDepthBits),
    maximumStepMeters: finiteOrNull(props.constraint.maximumStepMeters),
  };
  function unmeasured (
    status: "invalid" | "outside-clipping-range",
  ): IAutoMovieCameraDepthPrecisionReport { return ({
    ...base,
    lowerCode: null,
    upperCode: null,
    measuredStepMeters: null,
    status,
    passed: false,
  }); }
  const levels: number = 2 ** props.constraint.minimumDepthBits - 1;
  if (
    props.camera.trim().length === 0 ||
    !Number.isFinite(props.time) ||
    props.time < 0 ||
    !Number.isFinite(props.near) ||
    props.near <= 0 ||
    !Number.isFinite(props.far) ||
    props.far <= props.near ||
    !Number.isFinite(props.requiredNear) ||
    !Number.isFinite(props.requiredFar) ||
    props.requiredNear > props.requiredFar ||
    !Number.isSafeInteger(props.constraint.minimumDepthBits) ||
    props.constraint.minimumDepthBits <= 0 ||
    !Number.isSafeInteger(levels) ||
    !Number.isFinite(props.constraint.maximumStepMeters) ||
    props.constraint.maximumStepMeters <= 0
  )
    return unmeasured("invalid");
  if (props.requiredNear < props.near || props.requiredFar > props.far)
    return unmeasured("outside-clipping-range");
  const reciprocalNear: number = 1 / props.near;
  const reciprocalSpan: number = reciprocalNear - 1 / props.far;
  const normalized: number =
    (reciprocalNear - 1 / props.requiredFar) / reciprocalSpan;
  const upperCode: number = Math.ceil(
    Math.min(1, Math.max(0, normalized)) * levels,
  );
  const lowerCode: number = Math.max(0, upperCode - 1);
  function depthAtCode (code: number): number { return 1 / (reciprocalNear - (code / levels) * reciprocalSpan); }
  const measuredStepMeters: number =
    depthAtCode(upperCode) - depthAtCode(lowerCode);
  if (!Number.isFinite(measuredStepMeters) || measuredStepMeters < 0)
    return unmeasured("invalid");
  const passed: boolean =
    measuredStepMeters <= props.constraint.maximumStepMeters;
  return {
    ...base,
    lowerCode,
    upperCode,
    measuredStepMeters,
    status: passed ? "satisfied" : "insufficient-precision",
    passed,
  };
}
