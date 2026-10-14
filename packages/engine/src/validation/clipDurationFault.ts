import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";
/**
 * Return the first sampler-duration fault or null for finite nonnegative seconds.
 *
 * @evidence contracts/common.md#principled-implementation Type/finiteness admission precedes negativity so malformed numeric representation and negative finite duration retain their distinct established messages.
 * @evidence contracts/common.md#clear-and-simple-design The sampler owns its permissive zero-duration rule while committed artifact admission separately requires a strictly positive duration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite and negative values are reported unchanged; zero is an explicit supported sampler boundary, not a repaired positive clip.
 * @evidence contracts/common.md#meaningful-documentation States unknown duration input, range-kind field addressing, first-fault order and the sampler/artifact asymmetry.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar tests take constant work; constructing a fault and rendering its value adds message-conversion cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical duration admission serves sampler consumers without another per-track duration rule or persistent result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh fault may retain the offending value; accepted input returns null, with no clip buffers, clock cursor or task retained.
 * @author Samchon
 */
export const clipDurationFault: (duration: unknown) => IAutoMovieClipShapeFault | null = (
  duration: unknown,
): IAutoMovieClipShapeFault | null => {
  if (typeof duration !== "number" || !Number.isFinite(duration))
    return {
      kind: "range",
      field: "duration",
      message: `duration must be finite, but was ${String(duration)}`,
      value: duration,
    };
  if (duration < 0)
    return {
      kind: "range",
      field: "duration",
      message: `duration must be non-negative, but was ${duration}`,
      value: duration,
    };
  return null;
};
