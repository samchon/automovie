import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence.js";

/**
 * Where one member stands in its cycle, in `[0, 1)`.
 *
 * Phase is the slot's compiled `motionPhase`, derived from the formation seed
 * and the slot index, so the member that leads the stride leads it on every
 * machine and in every run. What is added to it is the ground its unit has
 * covered, expressed in cycles. No clock is read, and nothing accumulates
 * between frames: the same cues at the same time always resolve to the same
 * mathematical point under these inputs. That does not establish identical
 * captured bytes across GPU arithmetic or unrelated host state.
 *
 * @evidence contracts/common.md#principled-implementation Computes fractional phase as raw-floor(raw) from compiled member phase plus absolute cadence advance and radius-weighted turn; admitted finite/nonnegative metre radius and finite accumulators are premises, and very large accumulated values lose fractional precision in IEEE754 doubles rather than guaranteeing arbitrary-time phase accuracy.
 * @evidence contracts/common.md#clear-and-simple-design One scalar helper owns the CPU cycle-position convention shared with the shader's fract expression; cadence integration and per-member radius/phase acquisition remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual phase/travel/turn inputs without a wall clock, accumulated frame step or fixture gait-name rule; the default zero radius is pivot membership, not a correction for missing data.
 * @evidence contracts/common.md#meaningful-documentation Gives unit-interval result, seeded phase, metre radius and absolute input semantics while removing the unsupported captured-byte identity claim.
 * @evidence contracts/performance.md#efficient-algorithms Performs fixed-count scalar arithmetic and one floor in constant time/storage, independent of slots, gait samples or scene geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the already integrated cadence rather than resampling cues per member; pure inexpensive scalar evaluation retains no phase cache and matching values do not imply shared render effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows two scalar cadence fields and returns one number with no retained references, native handles or running task.
 */
export const formationCyclePosition: (
  cadence: Pick<IAutoMovieFormationCadence, "advance" | "turn">,
  phase: number,
  radius?: number,
) => number = (
  cadence: Pick<IAutoMovieFormationCadence, "advance" | "turn">,
  phase: number,
  /** The member's distance from its unit's origin, in meters. */
  radius: number = 0,
): number => {
  const raw: number = phase + cadence.advance + radius * cadence.turn;
  return raw - Math.floor(raw);
};
