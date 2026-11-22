import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanThrowObjectForm } from "./IAutoMovieMotionHumanThrowObjectForm";
import type { IAutoMovieMotionHumanThrowObjectLever } from "./IAutoMovieMotionHumanThrowObjectLever";

/**
 * The parameters of a throw (`IAutoMovieMotionHumanThrowObjectParams`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
 * @evidence contracts/development/design.md#principled-representation The target union, a closed style, a hand, the thrown and the lengthening props, and the flight's attitude.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `throwObject.plan` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No speed is typed by the author; a spin's rate is the act's, from the lever and the stand-off.
 */
export interface IAutoMovieMotionHumanThrowObjectParams {
  /** Where the object goes. */
  target: IAutoMovieMotionTarget;

  /** The style; `overarm` when absent. It fixes the release angle, the windup and the trunk's turn and tilt ({@link IAutoMovieMotionHumanThrowObjectForm.Style} gives each style's angle and windup, provisional). The speed follows from the distance and the angle by the range equation, so a farther target is a faster throw. */
  style?: IAutoMovieMotionHumanThrowObjectForm.Style;

  /** The throwing hand; `right` when absent. */
  hand?: AutoMovieHumanSide;

  /**
   * The held prop thrown: it rides the hand to the release, then flies
   * from it (`IAutoMovieMotionHumanActionPlan.launches`). The empty hand throws when
   * absent, as before.
   */
  prop?: string;

  /** The release angle above the horizontal, degrees; the style's when absent (`throwObjectForm.ANGLE`). A target the angle cannot reach is refused. */
  angle?: number;

  /**
   * How the prop turns in flight (`IAutoMovieProjectile.attitude`): along
   * its velocity for a javelin; `turns` for a knife, whose spin the act
   * chooses (`throwObjectLever.spin`); its release rotation kept when
   * absent.
   */
  attitude?:
    | IAutoMovieProjectile.Attitude
    | IAutoMovieMotionHumanThrowObjectLever.ITurns;

  /**
   * The implement held in the throwing hand that lengthens the arm: a
   * sling, an atlatl. The thrown prop leaves from its working point, and the
   * launch is the lever's (`throwObjectLever`). The hand throws when absent.
   */
  implement?: IAutoMovieMotionHumanThrowObjectLever.IImplement;

  /** How it is performed. */
  manner?: IAutoMovieMotionManner;
}
