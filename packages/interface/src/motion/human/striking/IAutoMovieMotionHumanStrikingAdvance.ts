import type { IAutoMovieMotionClock } from "../compose/IAutoMovieMotionClock";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The stroke of a held tool, shared by every blade and firearm action: the
 * tool is taken from where the hand holds it to a ready pose, carried along
 * a path to its decisive pose, kept there and returned, while the feet stay
 * or the leading foot steps or lunges under it.
 *
 * The action states only tool poses (hand frames built by
 * {@link StrikingHeld.hand}); this owns the time course and the body. The
 * clock is a phrase with the standard instants: the tool leaves the entry
 * hold for the ready pose by `ready`, runs its path from `strokeStart`, is at
 * its decisive pose at `stroke`, follows through to `strokeEnd`, stays until
 * `relax` and is back in the entry hold at `end`, or stays where the stroke
 * left it for an action that ends in its pose (a guard, a levelled aim).
 *
 * An advance carries the body with the stroke: the leading foot leaves the
 * floor at `strokeStart` and lands at `stroke`, the pelvis travels a share of
 * the foot's travel and sinks until both legs reach their feet, and the foot
 * and the pelvis come back from `relax` to `end` (`StrikingAdvance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.
 * @evidence contracts/development/design.md#principled-representation clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim.within, candidate); lexicon/HumanSword.ts (HumanSword.aim.advance, candidate); striking/StrikingAdvance.ts (StrikingAdvance.travel, advance); striking/StrikingBlade.ts (StrikingBlade.shoulder, advance); striking/StrikingAdvance.ts (StrikingAdvance.base, stroke); lexicon/HumanSword.ts (HumanSword.aim).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionClock.IClock, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingAdvance {
  /**
   * How the body goes with a stroke.
   *
   * @evidence contracts/development/common.md#meaningful-documentation How the body goes with a stroke.
   * @evidence contracts/development/design.md#principled-representation Closed choices "none", "step", "lunge" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim.within, candidate); lexicon/HumanSword.ts (HumanSword.aim.advance, candidate); striking/StrikingAdvance.ts (StrikingAdvance.travel, advance); striking/StrikingBlade.ts (StrikingBlade.shoulder, advance); lexicon/HumanSword.ts (HumanSword.aim).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSword.aim.within.
   */
  export type Advance = "none" | "step" | "lunge";

  /**
   * The base of a stroke on a phrase clock: the entry's posture, or the advance of the leading foot from `strokeStart` to `stroke` (its `travel`, metres, the advance's full travel when absent) and, unless the stroke stays, its recovery from `relax` to the end. Input stroke of StrikingAdvance.base.
   *
   * @evidence contracts/development/common.md#meaningful-documentation clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.
   * @evidence contracts/development/design.md#principled-representation clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingAdvance.ts (StrikingAdvance.base, stroke).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionClock.IClock, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IBaseStroke = {
    /** Strike action's relative event clock. */
    clock: IAutoMovieMotionClock.IClock;
    /** Stepping mode used to approach the target. */
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance;
    /** Optional approach distance in metres; omitted uses the selected advance's full travel. */
    travel?: number;
    /** World-space approach direction. */
    line: IAutoMovieVector3;
    /** Whether to keep the advanced stance after delivery instead of recovering it from relax to the clock's end. */
    stay: boolean;
    /** Acting side of the striking tool. */
    tool: {
      /** Left or right acting side. */
      side: "left" | "right";
    };
  };
}
