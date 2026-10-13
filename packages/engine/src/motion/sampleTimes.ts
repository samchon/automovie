import { windowSampleTimes } from "./windowSampleTimes";

/**
 * Return the endpoint-inclusive seconds grid from zero to duration at a positive Hz rate. The window sampler owns grid arithmetic and duplicate-end removal; zero duration returns one instant.
 *
 * @evidence contracts/common.md#principled-implementation Delegates the full-duration case to windowSampleTimes, so motion baking and validators use exactly the same endpoint and rounding convention.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper only fixes the window start at zero; interval admission and rounding remain with one window owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no consumer-specific sampling rate or extra endpoint adjustment; the supplied rate determines the grid.
 * @evidence contracts/common.md#meaningful-documentation States seconds, Hz, inclusive endpoints and the zero-duration result.
 * @evidence contracts/performance.md#efficient-algorithms For F intervals selected by duration times rate, delegated work and returned storage are O(F); the wrapper adds constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The full and shifted forms share one algorithm rather than separate arithmetic copies; returned arrays are not cached across mutable caller inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned number array; the wrapper acquires no handle or task and retains no previous grid.
 */
export const sampleTimes: (duration: number, sampleRate: number) => number [ ] = (duration: number, sampleRate: number): number[] =>
  windowSampleTimes(0, duration, sampleRate);
