import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type ArchetypeCourse, ArchetypeFrame } from "../core";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";

/**
 * One hoof's anchored position and orientation through a curved course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the articulation goals derived from native landing frames and signed stance travel.
 * @evidence contracts/development/design.md#principled-representation A landed body frame, centre offset and interval determine a fixed hoof target. A following stance is present during swing only.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's curved footprint path. Gait, stance timing and exact terminal geometry remain in their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact moves only during the declared swing and the model-space relative orientation uses the original landing frame.
 */
export namespace QuadrupedHoofTrack {
  /**
   * A committed stance, before it is converted into a world footprint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the state at landing, signed stance travel and duty fraction.
   * @evidence contracts/development/design.md#principled-representation The course owns the rigid landing frame and signed metres. The gait owns the stride fraction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ride uses duty to distinguish stance/swing and this owner reads the geometry and signed travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It stores no current body frame or previous sample.
   */
  export interface IStance {
    /** Fraction of a stride between this hoof's landing and lifting. */
    duty: number;
    /** Body state at actual touchdown, including its rigid world placement. */
    landed: ArchetypeCourse.IState;
    /** Signed metres the body travels over the entire stance. */
    travel: number;
  }

  /**
   * Convert the fixed world footprint or world swing to the current body frame.
   *
   * @param state Current course state, including the body's world placement.
   * @param rest Actual neutral hoof endpoints in model metres.
   * @param from Last committed stance.
   * @param to The next committed stance during swing. Omitted during stance.
   * @param amount The smooth swing progression from zero to one.
   * @param curved True when the route changes heading and needs a world-frame stance or swing.
   * @returns Model-space coordinates in metres. A curved route also returns the relative terminal axis rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines frames, units and the optional next stance.
   * @evidence contracts/development/implementation.md#principled-implementation Straight signed progress gives the same distance from the half-stance-centred landing in a common basis. A curved route anchors world-space points and frames and converts them to current model space. Swing interpolates the two adjacent landings.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan world points from landed states, optionally blend one next point/rotation, and apply the inverse current body placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The current yaw establishes only the relative readback and cannot reorient a planted sole in the world.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over at most two admitted stances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing rigid frame, vector and quaternion arithmetic. The route and gait already own the actual touchdown states.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh footprint and retains nothing between calls.
   */
  export function target(
    state: ArchetypeCourse.IState,
    rest: IAutoMovieVector3,
    from: IStance,
    to: IStance | undefined,
    amount: number,
    curved: boolean,
  ): Pick<QuadrupedRidePose.IGoal, "x" | "z" | "orientation"> {
    if (!curved)
      return {
        z:
          rest.z +
          (to === undefined
            ? from.travel / 2 - (state.progress - from.landed.progress)
            : -from.travel / 2 + ((from.travel + to.travel) / 2) * amount),
      };
    const foot: IAutoMovieVector3 = anchor(rest, from);
    const landed: IAutoMovieQuaternion = from.landed.placement.rotation;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      state.placement.rotation,
    );
    const world: IAutoMovieVector3 =
      to === undefined ? foot : Vector3.lerp(foot, anchor(rest, to), amount);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(world, state.placement.translation),
    );
    return {
      x: local.x,
      z: local.z,
      orientation: Quaternion.multiply(
        inverse,
        to === undefined
          ? landed
          : Quaternion.slerp(landed, to.landed.placement.rotation, amount),
      ),
    };
  }

  /** Centre a physical hoof around its stance using the admitted signed advance. */
  function anchor(
    rest: IAutoMovieVector3,
    support: IStance,
  ): IAutoMovieVector3 {
    return ArchetypeFrame.point(support.landed.placement, {
      x: rest.x,
      y: 0,
      z: rest.z + support.travel / 2,
    });
  }
}
