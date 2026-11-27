import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";

/**
 * The frame a limb fit is solved in (`solveHumanLimbFit`): the root's world
 * position and heading, so two people of one body doing the same thing in
 * different places, or one body facing another way, solve the same numbers.
 *
 * A pose and its goal are moved into the frame by taking away the root's world
 * position on all three axes and turning by minus its heading about +Y; the
 * limb solver reads only the geometry relative to the root, so a fit solved in
 * the frame is the fit solved in the world, moved. The fitted pose is handed
 * back with the caller's own root, since a limb fit changes the limb's joints
 * and not the root; its seed (the swivel and branch of
 * `fitSeededChainToTarget`) lives in the chain root's bone-local frame, which a
 * turn about +Y and a floor translation leave as they are, so it is handed back
 * unchanged. A goal attached to a bone (`on`), or kept clear of or resting on
 * other bodies' colliders (`clear`, `rests`), names world things the frame
 * would have to carry, and is solved in the world; so is a pose without a
 * root.
 */
export namespace IAutoMovieMotionHumanLimbFitFrame {
  /**
   * The frame a fit of a pose and a goal is solved in: a root's position and
   * heading.
   */
  export interface IFrame {
    /** The root's x, world metres. */
    x: number;

    /**
     * The root's y, world metres; omission means zero for an explicit floor
     * frame.
     */
    y?: number;

    /** The root's z, world metres. */
    z: number;

    /** The turn into the frame: minus the heading about +Y. */
    into: IAutoMovieQuaternion;
  }
}
