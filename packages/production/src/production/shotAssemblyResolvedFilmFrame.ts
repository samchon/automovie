import { IAutoMovieVideoEdit } from "@automovie/interface";

/**
 * Resolve a non-negative safe frame count from authored frames or seconds on the supplied production fps clock. Off-clock, non-finite and unsafe values return null.
 *
 * @evidence contracts/common.md#principled-implementation Seconds multiply by fps, then nearest-integer rounding is admitted within 64 Number.EPSILON times max(1, absolute raw frame). This is the existing floating tolerance, not exact rational-clock equality.
 * @evidence contracts/common.md#clear-and-simple-design The hard-cut gate shares one conversion rule for source bounds and contract duration; prior production admission supplies the finite positive fps premise.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Near-integer admission follows the stated relative tolerance without consumer-specific exceptions. Input time-domain and fps admission remain upstream: a sufficiently small negative raw value can round to negative zero and pass this output-based check.
 * @evidence contracts/common.md#meaningful-documentation States seconds/frame units, safe non-negative rounded result, null refusal, upstream clock/time premise and the precise floating tolerance, including negative-zero admission for malformed inputs.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of arithmetic and finiteness operations uses constant time and space; no frame sequence or duration-sized array is generated.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested boundary is evaluated directly with current fps; this constant calculation retains no cache across hard-cut checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number or null returns; no borrowed time object is modified and no resource or retained state is acquired.
 */
export const shotAssemblyResolvedFilmFrame: (time: IAutoMovieVideoEdit["sourceIn"], fps: number) => number | null = (
  time: IAutoMovieVideoEdit["sourceIn"],
  fps: number,
): number | null => {
  const raw: number = "frame" in time ? time.frame : time.seconds * fps;
  const rounded: number = Math.round(raw);
  return Number.isFinite(raw) &&
    Number.isSafeInteger(rounded) &&
    rounded >= 0 &&
    Math.abs(raw - rounded) <= Number.EPSILON * 64 * Math.max(1, Math.abs(raw))
    ? rounded
    : null;
};
