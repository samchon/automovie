import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Kicking the ball prop lying beside the support foot with the instep, from
 * standing: the kicking leg swings back, then through the ball and on.
 *
 * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
 * toes' joint, the middle of the instep, meets the back of the ball at its
 * centre's height along the kick's direction, the centre and the radius the
 * ball's own (`HumanBall`), the foot plantarflexed `POINT` degrees so the
 * instep faces the ball (Lees and Nolan 1998, J Sports Sci 16:211; Nunome et
 * al. 2002, Med Sci Sports Exerc 34:2028, compare the instep and side-foot
 * kicks). The backswing draws the foot back and up behind the ball (`CHAMBER`,
 * in shank lengths, provisional), the swing
 * (`AutoMovieMotionHumanLegPhrase.swing`) passes the contact at speed and runs
 * on along its line through the follow-through, and the foot returns to its
 * stance. The opposite arm swings out for balance. The support foot stays
 * planted where it stood, so the ball must lie within the kicking leg's reach
 * of its hip; a farther ball is refused with the reach. Phase lengths are
 * provisional, scaled by the manner's tempo. Events: the phrase's `ready`
 * (`backswing`), `strokeStart`, `stroke` (`contact`), `strokeEnd`
 * (`followThrough`), `relax`.
 *
 * Supply speed to meet the ball at the stroke's film instant and launch it with
 * the authored velocity. The support foot remains planted.
 */
export namespace IAutoMovieMotionHumanKickBall {
  /** Parameters. */
  export interface IParams {
    /**
     * The ball's prop subject: its `grip` contact is its centre and that grip's
     * aperture its diameter (`createBall`'s contacts).
     */
    ball: string;

    /** The kicking foot; `right` when absent. */
    foot?: AutoMovieHumanSide;

    /** Where the ball is kicked toward; along the heading when absent. */
    target?: IAutoMovieMotionTarget;

    /**
     * Horizontal launch speed of the ball, m/s, authored and never derived from
     * the leg. Omit for a contact-only kick: the foot meets the ball and the
     * ball is not launched. The foot meets the ball at the stroke's film
     * instant, 0.45 s after the start (the backswing 0.35 s and the swing 0.1
     * s; the follow-through 0.15 s and the return 0.45 s end the kick at 1.05
     * s; all provisional, scaled by the manner's tempo).
     */
    speed?: number;

    /**
     * Upward launch speed of the ball, m/s; 0.3 m/s when absent, a ground ball,
     * and read only with `speed`. A chip or a lofted kick takes a larger
     * value.
     */
    lift?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
