import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanStrikingQuality } from "./IAutoMovieMotionHumanStrikingQuality";

/**
 * A punch: the fist's knuckles brought onto the target along a measured path
 * and returned to the guard, with the trunk turning and the feet stepping or
 * pivoting to carry the shoulder.
 *
 * The law writes effector goals, not joint angles. The fist socket is
 * brought from where it is at the launch onto the target region's point
 * (another person's actual region, a prop point, a free point, or a virtual
 * opponent at range) on a minimum-jerk delivery that aims through the target
 * so the fist lands at 0.78 of its peak speed (Liu et al. 2022); the wrist
 * goal is the fist point less the hand-rotated socket offset, the elbow bend
 * hint and the shoulder carried by the trunk turn shape the arm, and the
 * engine's limb fit solves the joints. The target is tracked online with the
 * visuomotor latency ({@link StrikingAim}); the fist stops on the first
 * surface of the struck body it meets ({@link StrikingStroke}), so a guard on
 * the line is struck instead of the face it covers, and two punches thrown at
 * once meet whichever arm or head is in the way.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research
 * of #3201): `straight` lands nearly extended (elbow 5 to 25 degrees) along the
 * line, palm down; `hook` lands with the elbow near a right angle (70 to 100
 * degrees), arriving across the line, palm down; `uppercut` rises from below
 * with the elbow at 60 to 100 degrees, palm toward the puncher. A rear-hand
 * punch turns the trunk through to bring the rear shoulder forward and
 * pivots the rear foot on its ball; a lead hook turns the other way. A body
 * punch lowers the root through the knees. When the arm's band falls short,
 * the lead foot steps in by up to one stance length, never past the room in
 * front of the arms ({@link StrikingRoom}) and never toward a target that no
 * place on the line brings within the band, and the rear foot drags
 * from mid-delivery to mid-return (the IBA stepping jab), so no planted foot
 * is left behind a travelling hip; the trunk's turn is shared by the pelvis
 * and the lumbar and thoracic spine. Beyond that the fist extends
 * along the line at the band's reach and falls short, the declared
 * miss-at-maximum-reach rule.
 *
 * Timing: a lone punch takes the single maximal jab's 0.405 s (Stanley et al.
 * 2018); a punch that follows another punch's contact keeps the measured
 * combination intervals, 0.35 s between alternating hands and 0.45 s for the
 * same hand (Piorkowski et al. 2011), counted from that contact. The return
 * to the guard takes one alternating interval. Skill scales them
 * ({@link StrikingSkill}), and a seeded guard drop may hold the returning
 * glove low before it reaches the guard. A feint shows a share of the
 * delivery without contact and returns in the same time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: Which hand: the stance's lead or rear; lead for a straight or a hook and rear for an uppercut when absent. accuracy: Declared accuracy; `hit` when absent. feint: A feint: the share of the delivery shown before returning, in (0, 1).
 * @evidence contracts/development/design.md#principled-representation hand: Which hand: the stance's lead or rear; lead for a straight or a hook and rear for an uppercut when absent. accuracy: Declared accuracy; `hit` when absent. feint: A feint: the share of the delivery shown before returning, in (0, 1).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.punch, params); striking/punch.ts (punch.hand, params); striking/punch.ts (punch.plan, context); striking/punchContact.ts (punchContact.solve, context); striking/punchGeometry.ts (punchGeometry.build, context); striking/defend.ts (defend.telegraph).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanStrikingQuality.Accuracy, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPunch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, range and default.
   * @evidence contracts/development/design.md#principled-representation Closed unions for the technique and the hand, the interface's motion target, the accuracy union and a feint share in (0, 1), checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan, the defence's telegraph and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target and accuracy types.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The technique. */
    technique: "straight" | "hook" | "uppercut";

    /** Which hand: the stance's lead or rear; lead for a straight or a hook and rear for an uppercut when absent. */
    hand?: "lead" | "rear";

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: IAutoMovieMotionHumanStrikingQuality.Accuracy;

    /** A feint: the share of the delivery shown before returning, in (0, 1). */
    feint?: number;

    /**
     * How much repeats of the punch differ: `variation` in [0, 1] scales the
     * spread of the point aimed at within a person's region, and
     * `proficiency` replaces the performer's skill for that spread. Absent or
     * 0, every repeat is aimed at the region's own point.
     */
    manner?: Pick<IAutoMovieMotionManner, "variation" | "proficiency">;
  }
}
