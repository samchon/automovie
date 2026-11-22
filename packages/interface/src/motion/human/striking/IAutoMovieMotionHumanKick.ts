import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanKickGeometry } from "./IAutoMovieMotionHumanKickGeometry";
import type { IAutoMovieMotionHumanStrikingQuality } from "./IAutoMovieMotionHumanStrikingQuality";
import type { IAutoMovieMotionHumanStrikingRecord } from "./IAutoMovieMotionHumanStrikingRecord";

/**
 * A kick: the round kick's lower shin or the push kick's ball of the foot
 * brought onto the target, through a chamber, and recoiled to the replant.
 *
 * Effector goals, not keyed angles: the ankle travels on superposed
 * minimum-jerk units from its plant through the chamber to the contact and
 * back through a re-chamber, the knee's bend hint and the foot's rotation
 * riding along, and the engine's limb fit solves the leg. The contact is
 * decided on the fitted figure ({@link KickGeometry}): the two-segment solve
 * ({@link StrikingReach}) puts the lower shin (seven tenths of the way from
 * the knee) or the ball of the foot on the target point with the knee
 * between 5 and 40 degrees of flexion (35 for the push kick), and the body's
 * carriage ({@link KickCarriage}) leans the least that lets the fitted leg
 * hold that solve inside the hip's range of motion. A target nearer than the
 * band is met higher up the shin, as a jammed kick lands; one beyond it,
 * after a step-up of the support foot by up to half a stance, is missed at
 * the fitted leg's own reach. The chamber is the contact's leg with the knee
 * folded ({@link KickChamber}).
 *
 * Both gloves keep their guard (the kick-guard decision of the kickboxing
 * research of #3201).
 *
 * Timing, from launch to contact (Gavagan and Sayers 2017): preparation
 * 0.074 s, chamber 14 % and extension 11 % of the 1.02 s execution, recoil
 * 0.65 s ({@link StrikingSkill.KICK_PREPARATION}, `KICK_CHAMBER`,
 * `KICK_EXTENSION`, `KICK_RECOIL`). At elite skill a kick takes 0.33 s from
 * launch to contact and 0.98 s in all. The performer's `recovery` skill
 * multiplies the chamber and the recoil by 1.4 at novice, 1.3 at amateur,
 * 1.1 at trained and 1.0 at elite, and its `speed` skill the extension by
 * 1.06 to 1.0 ({@link StrikingSkill.recovery}, {@link StrikingSkill.strike},
 * levels on {@link HumanSkill.LEVELS}), so launch to contact is 0.39 s at
 * novice, 0.38 at amateur, 0.35 at trained and 0.33 at elite, and the whole
 * kick 1.30, 1.22, 1.06 and 0.98 s. A seeded timing variability is added to
 * the chamber ({@link HumanSkill.jitter}). A feint shows the chamber and
 * returns without extending. The round kick lands at 0.55 of its peak foot
 * speed; the peak (6.5 m/s novice, 14.3 m/s elite) is a reference the kick
 * does not read ({@link StrikingSkill.KICK_PEAK_SPEED}). The chamber's fold
 * and the pelvis's turn scale by the skill's range share
 * ({@link StrikingSkill.amplitude}). Every phase applies to low, body and
 * high kicks alike, an approximation the source states (it timed head
 * kicks). A kick does not read `manner`.
 *
 * A round kick may be redirected before its chamber key into another round
 * kick ({@link KickRedirect}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation leg: Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent. accuracy: Declared accuracy; `hit` when absent.
 * @evidence contracts/development/design.md#principled-representation leg: Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent. accuracy: Declared accuracy; `hit` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.kick, params); striking/kick.ts (kick.leg, params); striking/kick.ts (kick.plan, context); striking/kick.ts (kick.redirected, context); striking/kick.ts (kick.measure, context); striking/KickGeometry.ts (KickGeometry.build, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanStrikingQuality.Accuracy, IAutoMovieMotionHumanKickGeometry.ISource identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanKick {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation Closed unions for the technique and the leg, the interface's motion target, the accuracy union and a feint flag.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan, the defence's telegraph and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target and accuracy types.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The technique: the round kick with the shin, or the push kick (teep) with the ball of the foot. */
    technique: "round" | "push";

    /** Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent. */
    leg?: "lead" | "rear";

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: IAutoMovieMotionHumanStrikingQuality.Accuracy;

    /** A feint: the kick shows its chamber and returns without extending. */
    feint?: boolean;
  }

  /**
   * A kick's plan: a strike's plan that another kick may continue from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation source: What a redirect continues.
   * @evidence contracts/development/design.md#principled-representation source: What a redirect continues.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.plan, return); striking/kick.ts (kick.continues, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanKickGeometry.ISource identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan extends IAutoMovieMotionHumanStrikingRecord.IPlan {
    /** What a redirect continues. */
    source: IAutoMovieMotionHumanKickGeometry.ISource;
  }
}
