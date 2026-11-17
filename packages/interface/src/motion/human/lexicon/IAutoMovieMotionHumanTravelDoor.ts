import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";

/**
 * Going through a doorway: a walk that squares up before a named opening
 * of one of the performance's obstacles, passes through its middle and
 * comes out beyond it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The walker passes two places on the opening's own line, `CLEAR` before
 * its sill and the same beyond it, so the body crosses the opening at
 * right angles to its width wherever the walk began. The walk itself asks
 * the obstacles about each stretch (`walkClear`), so an opening narrower
 * than the walker's chest or lower than the walker stands is refused there
 * with the measure it would need. First pass: the leaf of a door is not
 * opened or held; an opening is a hole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation aperture: The opening's id within that obstacle; its only opening when absent. pace: The pace; `normal` when absent.
 * @evidence contracts/development/design.md#principled-representation aperture: The opening's id within that obstacle; its only opening when absent. pace: The pace; `normal` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, context); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTravelDoor {
  /**
   * Parameters of a passage.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation aperture: The opening's id within that obstacle; its only opening when absent. pace: The pace; `normal` when absent.
   * @evidence contracts/development/design.md#principled-representation aperture: The opening's id within that obstacle; its only opening when absent. pace: The pace; `normal` when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, context); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The obstacle whose opening is passed: its subject id. */
    through: string;

    /** The opening's id within that obstacle; its only opening when absent. */
    aperture?: string;

    /** The pace; `normal` when absent. */
    pace?: IAutoMovieMotionHumanWalkParams["pace"];
  }
}
