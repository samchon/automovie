import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Kicking the ball prop lying beside the support foot with the instep, from
 * standing: the kicking leg swings back, then through the ball and on.
 *
 * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
 * toes' joint, the middle of the instep, meets the back of the ball at its
 * centre's height along the kick's direction, the centre and the radius the
 * ball's own (`HumanBall`), the foot plantarflexed `POINT`
 * degrees so the instep faces the ball (Lees and Nolan 1998, J Sports Sci
 * 16:211; Nunome et al. 2002, Med Sci Sports Exerc 34:2028, compare the
 * instep and side-foot kicks). The backswing draws the foot back and up
 * behind the ball (`CHAMBER`, in shank lengths, provisional), the swing
 * (`AutoMovieMotionHumanLegPhrase.swing`) passes the contact at speed and runs on
 * along its line through the follow-through, and the foot returns to its
 * stance. The opposite arm swings out for balance. The support foot stays
 * planted where it stood, so the ball must lie within the kicking leg's
 * reach of its hip; a farther ball is refused with the reach. Phase lengths
 * are provisional, scaled by the manner's tempo. Events: the phrase's
 * `ready` (`backswing`), `strokeStart`, `stroke` (`contact`), `strokeEnd`
 * (`followThrough`), `relax`.
 *
 * Not yet: the approach run-up at 30 to 45 degrees and the support foot's
 * plant step beside the ball, the side-foot and toe kicks, the ball's launch
 * (A4), a moving ball, and striking a ball with a held implement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation foot: The kicking foot; `right` when absent. toward: Where the ball is kicked toward; along the heading when absent.
 * @evidence contracts/development/design.md#principled-representation foot: The kicking foot; `right` when absent. toward: Where the ball is kicked toward; along the heading when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ballStrike/kickBall.ts (kickBall.plan, context); chain/HumanChainMutual.ts (HumanChainMutual.kickBall, params); executable/cases/ballStrikeCases.ts (ballStrikeCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanKickBall {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The ball, the kicking foot and the direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball is the scene's prop; its size is its own.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The ball's prop subject: its `grip` contact is its centre and that grip's aperture its diameter (`createBall`'s contacts). */
    ball: string;

    /** The kicking foot; `right` when absent. */
    foot?: "left" | "right";

    /** Where the ball is kicked toward; along the heading when absent. */
    toward?: IAutoMovieMotionTarget;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }
}
