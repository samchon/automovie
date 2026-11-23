import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanThrowObjectForm } from "./IAutoMovieMotionHumanThrowObjectForm";
import type { IAutoMovieMotionHumanThrowObjectLever } from "./IAutoMovieMotionHumanThrowObjectLever";

/** The parameters of a throw (`IAutoMovieMotionHumanThrowObjectParams`). */
export interface IAutoMovieMotionHumanThrowObjectParams {
  /** Where the object goes. */
  target: IAutoMovieMotionTarget;

  /**
   * The style; `overarm` when absent. It fixes the release angle, the windup
   * and the trunk's turn and tilt
   * ({@link IAutoMovieMotionHumanThrowObjectForm.Style} gives each style's angle
   * and windup, provisional). The speed follows from the distance and the angle
   * by the range equation, so a farther target is a faster throw.
   */
  style?: IAutoMovieMotionHumanThrowObjectForm.Style;

  /** The throwing hand; `right` when absent. */
  hand?: AutoMovieHumanSide;

  /**
   * The held prop thrown: it rides the hand to the release, then flies from it
   * (`IAutoMovieMotionHumanActionPlan.launches`). The empty hand throws when
   * absent, as before.
   */
  prop?: string;

  /**
   * The release angle above the horizontal, degrees; the style's when absent
   * (`throwObjectForm.ANGLE`). A target the angle cannot reach is refused.
   */
  angle?: number;

  /**
   * How the prop turns in flight (`IAutoMovieProjectile.attitude`): along its
   * velocity for a javelin; `turns` for a knife, whose spin the act chooses
   * (`throwObjectLever.spin`); its release rotation kept when absent.
   */
  attitude?:
    | IAutoMovieProjectile.Attitude
    | IAutoMovieMotionHumanThrowObjectLever.ITurns;

  /**
   * The implement held in the throwing hand that lengthens the arm: a sling, an
   * atlatl. The thrown prop leaves from its working point, and the launch is
   * the lever's (`throwObjectLever`). The hand throws when absent.
   */
  implement?: IAutoMovieMotionHumanThrowObjectLever.IImplement;

  /** How it is performed. */
  manner?: IAutoMovieMotionManner;
}
