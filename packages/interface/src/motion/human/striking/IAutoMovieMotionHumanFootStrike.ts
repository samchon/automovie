import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A foot strike beyond the round and push kicks: the heel, the sole or the
 * blade of the foot brought onto the target through a chamber and recoiled
 * to the stance.
 *
 * - `side`: the hip turned over a quarter turn, the heel driven along the
 *   line with the sole toward the target.
 * - `back`: the body turned away a half turn on the support ball and the heel
 *   thrust behind it along the line.
 * - `hook` and `crescent`: the leg sweeps across the target, the hook's heel
 *   toward the kicker's own side and the crescent's sole away from it.
 * - `axe`: the straight leg rises and the heel comes down onto the target.
 * - `stomp`: the knee rises and the sole drives straight down onto a
 *   floor-level target.
 * - `sweep`: the sole reaps the partner's support ankle across the line; the
 *   partner's falling is its own action, synced to the contact.
 *
 * `spin` turns the pelvis a whole turn on the support ball before the
 * strike; `jump` leaves the floor with both feet before the contact and lands
 * after it. A target beyond the leg's reach is missed at the leg's full
 * reach along its line.
 *
 * Timing: a side kick lands 0.77 s after its launch, the middle of the 0.70
 * to 0.84 s execution Pieter and Pieter (1995) tabulate; the others keep the
 * round kick's chamber and extension (Gavagan and Sayers 2017), 0.33 s, a
 * spin adds as much again and a jump 0.15 s; the recoil is the round kick's
 * 0.65 s. Skill scales them as it scales the kick's. The extension aims
 * through the target so the foot meets it at 0.82 of the unit, after its
 * peak speed, as the side kick's peak foot speed comes at 82 % of its
 * extension (Wąsik 2011).
 *
 * @evidence contracts/development/common.md#meaningful-documentation technique: The foot strike. leg: The kicking leg, rear when absent. at: What it strikes. spin: A whole turn first. jump: Off the floor at contact.
 * @evidence contracts/development/design.md#principled-representation A closed technique union, a target, the leg side and two modifier flags.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the foot strike law and its strike rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the motion target; the law owns reach.
 */
export namespace IAutoMovieMotionHumanFootStrike {
  /**
   * The foot strikes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the seven foot strikes.
   * @evidence contracts/development/design.md#principled-representation Explicit literals, each with its contact point, travel and turn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the foot strike law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law owns each technique's geometry.
   */
  export type Technique =
    | "side"
    | "back"
    | "hook"
    | "crescent"
    | "axe"
    | "stomp"
    | "sweep";

  /**
   * The kicking leg: the stance's lead or rear.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two legs by the stance.
   * @evidence contracts/development/design.md#principled-representation Two literals relative to the stance's lead.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the foot strike law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law resolves the side from the entry's stance.
   */
  export type Leg = "lead" | "rear";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The technique, the target, the leg and the two modifiers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the foot strike plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The foot strike. Launch to contact: `side` 0.77 s (the middle of 0.70 to 0.84 s, Pieter and Pieter); every other technique 0.33 s, the round kick's ({@link IAutoMovieMotionHumanKick}); times 1.06 at novice to 1.0 at elite ({@link footStrike.SIDE}, {@link footStrike.KICK}). The recoil is 0.65 s. */
    technique: IAutoMovieMotionHumanFootStrike.Technique;

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** The kicking leg; rear when absent. */
    leg?: IAutoMovieMotionHumanFootStrike.Leg;

    /** A whole turn on the support ball before the strike, adding 0.33 s before the contact ({@link footStrike.KICK}); none when absent. */
    spin?: boolean;

    /** Off the floor with both feet at the contact, adding 0.15 s before it and lifting 0.25 of the leg ({@link footStrike.JUMP}, provisional); planted when absent. */
    jump?: boolean;
  }
}
