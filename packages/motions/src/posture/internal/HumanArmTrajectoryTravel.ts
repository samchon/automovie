import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A probe's travel between two waypoints of an arm's trajectory, read against
 * the arm's own base: the shoulder's parent, which a carried body (a rider, a
 * passenger, a walker's trunk) moves with its carrier. A path's speed bound and
 * its length are the arm's own motion, so a car cruising at 6 m/s charges
 * nothing to the arm riding in it; read in the world, every arm in a moving
 * carrier breaks the bound whatever it does, and slowing the action never slows
 * the carrier (Hollerbach's time scaling holds only for motion relative to the
 * base). The clearance reads a probe against a moving shape the same way
 * (`HumanArmTrajectoryPairs.relative`).
 */
export namespace HumanArmTrajectoryTravel {
  /*
   * A probe's step from one waypoint to the next, against the arm's base: its
   * place in the later base frame less its place in the earlier one, turned
   * into the later waypoint's world orientation.
   * Parameter from: The earlier waypoint's frame.
   * Parameter to: The later waypoint's frame.
   * Parameter p: The probe's world point at the earlier waypoint.
   * Parameter q: The probe's world point at the later waypoint.
   * Returns: The step, world metres in the later base's orientation.
   */
  export function step(
    from: IAutoMovieMotionHumanArmGeometry.IFrame,
    to: IAutoMovieMotionHumanArmGeometry.IFrame,
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const local = (
      frame: IAutoMovieMotionHumanArmGeometry.IFrame,
      x: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(frame.parent.rotation),
        AutoMovieEngineVector3.subtract(x, frame.parent.position),
      );
    return AutoMovieEngineQuaternion.rotateVector(
      to.parent.rotation,
      AutoMovieEngineVector3.subtract(local(to, q), local(from, p)),
    );
  }

  /*
   * The turn that carries a direction read in the later waypoint's base
   * orientation onto the earlier waypoint's, for the earlier point's share of a
   * step's gradient: the earlier base's rotation after the later one's
   * inverse.
   * Parameter from: The earlier waypoint's frame.
   * Parameter to: The later waypoint's frame.
   * Returns: The turn.
   */
  export function back(
    from: IAutoMovieMotionHumanArmGeometry.IFrame,
    to: IAutoMovieMotionHumanArmGeometry.IFrame,
  ): IAutoMovieQuaternion {
    return AutoMovieEngineQuaternion.multiply(
      from.parent.rotation,
      AutoMovieEngineQuaternion.inverse(to.parent.rotation),
    );
  }
}
