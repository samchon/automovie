import { IAutoMovieActionCall } from "@automovie/interface";

/**
 * The shot-local interval one action occupies, `[start, end]` in seconds.
 *
 * An `"auto"` duration fills to the shot's end; a numeric one ends at
 * `start + duration`, clipped to the shot's end. The action's timing is assumed
 * already gated, so `start` lies inside the shot.
 *
 * @param action The gated action.
 * @param shotDuration The shot's length in seconds.
 * @returns The action's start and end, shot-local seconds.
 *
 * @evidence contracts/common.md#principled-implementation Reads the action's own start and resolves `"auto"` to the shot end, the meaning the performance compiler gives it, and clips a numeric end to the shot because no frame exists past it.
 * @evidence contracts/common.md#clear-and-simple-design One span rule read by the region-overlap gate and the blocking anchor gate, so both judge an action over the same interval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every verb's span is computed the same way; no action receives a padded or shortened interval.
 * @evidence contracts/common.md#meaningful-documentation States both duration forms and their ends, the clipping, the gated-timing premise, and the unit and frame of the result.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one comparison and one addition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one action and one duration that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the two-element tuple.
 */
export function performShotActionSpan (
  action: IAutoMovieActionCall,
  shotDuration: number,
): [number, number] { return [
  action.start,
  action.duration === "auto"
    ? shotDuration
    : Math.min(action.start + action.duration, shotDuration),
]; }
