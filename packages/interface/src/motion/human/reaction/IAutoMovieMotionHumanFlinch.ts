import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A flinch: the protective startle away from a sudden threat or a blow, the
 * head and trunk pulled away from it, the shoulders raised and the hands
 * brought up before the face, then a return to what the body held.
 *
 * The startle pattern (Landis and Hunt 1939, The Startle Pattern; Brown et
 * al. 1991, Brain 114:1891) starts with the eye blink at 30 to 50 ms, the head
 * at about 60 ms and the arms near 100 ms, peaks within about 0.2 s and fades
 * over a few tenths of a second, so the flinch reaches its peak at 0.2 s and
 * returns by 0.6 s. Its size grows with `intensity`: the body above the hips leans lightly away
 * from the threat (a quarter of the reach's lean limit) and the hips shift
 * away by 1.8 % of the stature, so the head moves by the trunk's height above
 * the hips times the lean's sine plus the shift; the neck ducks lightly, the
 * hands close into fists and rise to cover the face (provisional sizes, no
 * located kinematic amplitude). The lean pivots at the hips and the feet stay
 * planted. Every part leaves what the entry held and returns to it, so a
 * flinch out of quiet standing ends in quiet standing.
 * The threat is a target (the incoming weapon's region, a prop, a point), read
 * at the start.
 *
 * The action is rows over the posture it was entered in: one phrase with no
 * preparation, whose attack is the rise and whose retraction the return, and
 * a sway of the root and the trunk, a head, two hand and two arm primitives
 * that all rise to the `stroke` instant and fall to the end on the clock's envelope. A guard or a
 * defence may cancel it from the peak on, a stagger or a knockdown at any
 * time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Where the threat comes from; a place ahead of the performer when absent. intensity: How strong, in (0, 1]; 1 when absent.
 * @evidence contracts/development/design.md#principled-representation from: Where the threat comes from; a place ahead of the performer when absent. intensity: How strong, in (0, 1]; 1 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.flinch, params); reaction/flinch.ts (flinch.plan, context); reaction/flinch.ts (flinch.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanFlinch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the threat's target and the intensity's range and default.
   * @evidence contracts/development/design.md#principled-representation The threat is the interface's motion-target union and the intensity a share in (0, 1], checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** Where the threat comes from; a place ahead of the performer when absent. */
    from?: IAutoMovieMotionTarget;

    /** How strong, in (0, 1]; 1 when absent. */
    intensity?: number;

    /** How it is performed; its intensity is `intensity` unless it states one. */
    manner?: IAutoMovieMotionManner.IManner;
  }
}
