import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchUpright } from "./IAutoMovieMotionHumanTouchUpright";

/**
 * How far a vessel is leaned toward the face at the lips, and turned there, so
 * the arm that brings it holds it as a person drinks: the least lean, in
 * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the vessel
 * where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its reached
 * axis within a `LEAN_STEP` of the asked one), with the facing
 * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis best,
 * or for a vessel held by the grasp it was taken up by, the lean alone
 * (`held`). Held exactly upright at the lips the vessel asks the elbow up to
 * the shoulder's height; a drinker tips the glass at the lips with the elbow
 * low (Murphy, Willén and Sunnerhagen 2011).
 */
export namespace IAutoMovieMotionHumanTouchDrink {
  /**
   * A vessel held by a kept grasp, leaned toward the face: the lean and the
   * wrist's goal that brings the vessel there.
   */
  export interface IHeld {
    /**
     * How far the vessel's axis leans from where the grasp holds it toward the
     * region, degrees.
     */
    lean: number;

    /**
     * The wrist's goal at that lean: its point, its rotation, the elbow's hint
     * and the vessel's point as the contact, world.
     */
    goal: IAutoMovieHumanLimbGoal;
  }

  /**
   * The facing and lean `drinking` found, with the elbow's hint its arm was
   * admitted with, so the stroke shows that arm.
   */
  export interface IDrink extends IAutoMovieMotionHumanTouchUpright.IFacing {
    /** The elbow's hint, world metres. */
    bend: IAutoMovieVector3;
  }

  /**
   * Where the vessel is held after it arrives, while the drinker drinks: the
   * posture with the head turned for the drinking phase and the region on it. A
   * lean is admitted only if the arm still holds the vessel at its asked axis
   * there.
   */
  export interface IAfter {
    /** The posture of the drinking phase. */
    posture: IAutoMovieMotionHumanPosture;

    /** The region on it. */
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;
  }
}
