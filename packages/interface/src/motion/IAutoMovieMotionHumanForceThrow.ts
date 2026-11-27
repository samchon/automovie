import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieResolveCenterOfMass } from "../pose/IAutoMovieResolveCenterOfMass";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * The throw of a pulled body whose base has broken: the swing over the
 * thrower's fulcrum, the release where the centre comes level with it and the
 * flight to the landing, for `HumanForceResponse`'s `thrown`.
 *
 * First pass: the body is rigid in the pose it had when its base broke, through
 * the swing and the flight; the swing's fulcrum is fixed at the thrower's
 * placed region at that instant.
 */
export namespace IAutoMovieMotionHumanForceThrow {
  /**
   * What the response hands the throw: the pulled body's model, the pull's
   * direction, the instant its base breaks, its pose frozen there, its centre's
   * speed then, its yield before and its feet's plant windows.
   */
  export interface IProps {
    /** The body's mass model. */
    model: IAutoMovieResolveCenterOfMass.IModel;

    /** The pull's horizontal direction, unit, world. */
    direction: IAutoMovieVector3;

    /** Seconds from the action's start to the broken base. */
    broken: number;

    /** The body's pose at the broken base, written by joints alone. */
    frozen: IAutoMovieMotionHumanPosture;

    /** The centre's speed along the pull at the broken base, m/s. */
    speed: number;

    /** The pull, newtons, horizontal along `direction`. */
    force: number;

    /** The grip sites' mean height, world metres. */
    grip: number;

    /** Seconds the pull lasts after the broken base. */
    remaining: number;

    /**
     * The yield's posture before the broken base.
     *
     * @param seconds Seconds since the action's start.
     * @returns The posture.
     */
    yieldAt(seconds: number): IAutoMovieMotionHumanPosture;

    /**
     * A foot's plant on the floor from the start.
     *
     * @param part The foot.
     * @param to The share it ends at.
     * @returns The window.
     */
    plant(
      part: "leftFoot" | "rightFoot",
      to: number,
    ): IAutoMovieMotionHumanContactWindow;
  }
}
