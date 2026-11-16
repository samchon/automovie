import type { IAutoMovieProjectile } from "@automovie/engine";
import type { AutoMovieMotionTarget } from "@automovie/interface";

import type { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { HumanHand } from "../posture/HumanHand";
import type { throwObjectForm } from "./throwObjectForm";
import type { throwObjectLever } from "./throwObjectLever";

/**
 * The parameters of a throw (`throwObject.IParams`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
 * @evidence contracts/development/design.md#principled-representation The target union, a closed style, a hand, the thrown and the lengthening props, and the flight's attitude.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `throwObject.plan` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No speed is typed by the author; a spin's rate is the act's, from the lever and the stand-off.
 */
export interface IThrowObjectParams {
  /** Where the object goes. */
  at: AutoMovieMotionTarget;

  /** The style; `overarm` when absent. */
  style?: throwObjectForm.Style;

  /** The throwing hand; `right` when absent. */
  hand?: HumanHand.Side;

  /**
   * The held prop thrown: it rides the hand to the release, then flies
   * from it (`IHumanActionPlan.launches`). The empty hand throws when
   * absent, as before.
   */
  prop?: string;

  /** The release angle above the horizontal, degrees; the style's when absent. */
  angle?: number;

  /**
   * How the prop turns in flight (`IAutoMovieProjectile.attitude`): along
   * its velocity for a javelin; `turns` for a knife, whose spin the act
   * chooses ({@link throwObjectLever.spin}); its release rotation kept when
   * absent.
   */
  attitude?: IAutoMovieProjectile.Attitude | throwObjectLever.ITurns;

  /**
   * The implement held in the throwing hand that lengthens the arm: a
   * sling, an atlatl. The thrown prop leaves from its working point, and the
   * launch is the lever's (`throwObjectLever`). The hand throws when absent.
   */
  implement?: throwObjectLever.IImplement;

  /** How it is performed. */
  manner?: AutoMovieMotionManner.IManner;
}
