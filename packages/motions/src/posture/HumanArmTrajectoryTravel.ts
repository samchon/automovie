import type { IAutoMovieMotionHumanArmGeometry, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

/**
 * A probe's travel between two waypoints of an arm's trajectory, read
 * against the arm's own base: the shoulder's parent, which a carried body
 * (a rider, a passenger, a walker's trunk) moves with its carrier. A path's
 * speed bound and its length are the arm's own motion, so a car cruising at
 * 6 m/s charges nothing to the arm riding in it; read in the world, every
 * arm in a moving carrier breaks the bound whatever it does, and slowing the
 * action never slows the carrier (Hollerbach's time scaling holds only for
 * motion relative to the base). The clearance reads a probe against a
 * moving shape the same way (`HumanArmTrajectoryPairs.relative`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured, against which frame and why the world frame fails.
 * @evidence contracts/development/design.md#principled-representation The step is the difference of the probe's two places in their waypoints' base frames, expressed in the later waypoint's world orientation, so its length is frame-free and its direction maps onto the world Jacobians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The step and the turn that carries a later waypoint's direction back to the earlier one, read by the model, the convex subproblem and the speed refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No carrier is named: the base is the frame each waypoint already reads.
 */
export namespace HumanArmTrajectoryTravel {
  /**
   * A probe's step from one waypoint to the next, against the arm's base:
   * its place in the later base frame less its place in the earlier one,
   * turned into the later waypoint's world orientation.
   *
   * @param from The earlier waypoint's frame.
   * @param to The later waypoint's frame.
   * @param p The probe's world point at the earlier waypoint.
   * @param q The probe's world point at the later waypoint.
   * @returns The step, world metres in the later base's orientation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frames and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each point taken into its waypoint's base frame by the inverse of that frame's pose; their difference turned back by the later frame's rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two localisations and one rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still base gives the world step exactly.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function step(
    from: IAutoMovieMotionHumanArmGeometry.IFrame,
    to: IAutoMovieMotionHumanArmGeometry.IFrame,
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const local = (frame: IAutoMovieMotionHumanArmGeometry.IFrame, x: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.parent.rotation),
        Vector3.subtract(x, frame.parent.position),
      );
    return Quaternion.rotateVector(
      to.parent.rotation,
      Vector3.subtract(local(to, q), local(from, p)),
    );
  }

  /**
   * The turn that carries a direction read in the later waypoint's base
   * orientation onto the earlier waypoint's, for the earlier point's share
   * of a step's gradient: the earlier base's rotation after the later one's
   * inverse.
   *
   * @param from The earlier waypoint's frame.
   * @param to The later waypoint's frame.
   * @returns The turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the turn carries and its order.
   * @evidence contracts/development/implementation.md#principled-implementation The step's derivative in the earlier point is the later rotation after the earlier inverse, so a direction dotted with it is the earlier rotation after the later inverse applied to the direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still base gives the identity.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function back(from: IAutoMovieMotionHumanArmGeometry.IFrame, to: IAutoMovieMotionHumanArmGeometry.IFrame): IAutoMovieQuaternion {
    return Quaternion.multiply(
      from.parent.rotation,
      Quaternion.inverse(to.parent.rotation),
    );
  }
}
