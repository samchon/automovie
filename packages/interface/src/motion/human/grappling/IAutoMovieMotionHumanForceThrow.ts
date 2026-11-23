import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolveCenterOfMass } from "../../../pose/IAutoMovieResolveCenterOfMass";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The throw of a pulled body whose base has broken (#3439): the swing over
 * the thrower's fulcrum, the release where the centre comes level with it
 * and the flight to the landing, for `HumanForceResponse`'s `thrown`.
 *
 * First pass: the body is rigid in the pose it had when its base broke,
 * through the swing and the flight; the swing's fulcrum is fixed at the
 * thrower's placed region at that instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation broken: Seconds from the action's start to the broken base. grip: The grip sites' mean height, world metres. remaining: Seconds the pull lasts after the broken base.
 * @evidence contracts/development/design.md#principled-representation broken: Seconds from the action's start to the broken base. grip: The grip sites' mean height, world metres. remaining: Seconds the pull lasts after the broken base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceThrow.ts (HumanForceThrow.plan, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieResolveCenterOfMass.IModel, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanForceThrow {
  /**
   * What the response hands the throw: the pulled body's model, the pull's
   * direction, the instant its base breaks, its pose frozen there, its
   * centre's speed then, its yield before and its feet's plant windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The state of the pulled body at the broken base, the throw's initial condition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ten members, each read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The yield and the plant are the response's own functions, so the throw does not restate them.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanForceThrow.IProps.yieldAt: The yield's posture before the broken base.
     */
    yieldAt(seconds: number): IAutoMovieMotionHumanPosture;

    /**
     * A foot's plant on the floor from the start.
     *
     * @param part The foot.
     * @param to The share it ends at.
     * @returns The window.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanForceThrow.IProps.plant: A foot's plant on the floor from the start.
     */
    plant(
      part: "leftFoot" | "rightFoot",
      to: number,
    ): IAutoMovieMotionHumanContactWindow;
  }
}
