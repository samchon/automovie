import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasuredChannelReading } from "./IAutoMovieHumanBodyMeasuredChannelReading";

/**
 * Inputs of `solveHumanBodyMeasuredChannel`: the basis, the shape to solve
 * from, the one channel the solve moves, the target and, when the channel
 * has no rule of its own, the instrument it is read by.
 *
 * @evidence contracts/common.md#principled-implementation A basis, fixed starting shape, named channel and metric target define a one-dimensional inversion; an optional instrument supplies an alternate rule.
 * @evidence contracts/common.md#clear-and-simple-design Inputs keep the channel being moved separate from the rule used to measure it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the selected channel may change; an unavailable instrument is not replaced with a fitted answer.
 * @evidence contracts/common.md#meaningful-documentation Members state metres, read-only starting shape and default instrument selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measured channel solver inputs declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measured channel solver inputs schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The measured channel solver inputs type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelProps {
  /** The body basis whose shaped rest skin is measured. */
  basis: IAutoMovieHumanBodyBasis;

  /** The shape to solve from; only the solved channel's weight changes. */
  shape: Readonly<Record<string, number>>;

  /** The basis channel id the solve moves. */
  channel: string;

  /** The target value, metres. */
  targetMetres: number;

  /** The instrument to read; omitted reads `humanBodyChannelReading(channel)`: its own rule or its table binding. */
  measurement?: IAutoMovieHumanBodyMeasuredChannelReading;
}
