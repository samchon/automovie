import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Rigid-grip readings of a held prop in the displayed wrist frame: the prop's
 * pose relative to the wrist, its drift across samples and the control that
 * shows a two-point drift bound needs its rotation term.
 */
export namespace archetypeCatalogueRigidGrip {
  /**
   * Express the independently displayed prop in the displayed wrist frame.
   *
   * @param wrist The displayed wrist frame, world.
   * @param prop The displayed prop frame, world.
   * @returns The prop frame in the wrist frame, metres and a unit quaternion.
   */
  export function relative(
    wrist: IAutoMovieRigidTransform,
    prop: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(wrist.rotation);
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, wrist.position),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };
  }

  /**
   * Bound translation and every angular direction at the same 30 mm lever arm.
   *
   * @param initial The wrist-relative prop frame at the grasp.
   * @param current The wrist-relative prop frame at a later sample.
   * @param mark One prop-fixed point, metres in the prop frame.
   * @param edge A second prop-fixed point, metres in the prop frame.
   * @returns The greatest displacement of either point or of the rotation at a 30 mm arm, metres.
   */
  export function drift(
    initial: IAutoMovieRigidTransform,
    current: IAutoMovieRigidTransform,
    mark: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): number {
    return Math.max(
      Vector3.distance(point(initial, mark), point(current, mark)),
      Vector3.distance(point(initial, edge), point(current, edge)),
      0.06 * Math.sin(Quaternion.angle(initial.rotation, current.rotation) / 2),
    );
  }

  /**
   * Require that a twist about the line through both points, which leaves them
   * fixed, still exceeds the 1 mm drift bound through its rotation term.
   *
   * @param initial The wrist-relative prop frame at the grasp.
   * @param mark One prop-fixed point, metres in the prop frame.
   * @param edge A second prop-fixed point on the twist axis, metres in the prop frame.
   */
  export function verifyTwistRejection(
    initial: IAutoMovieRigidTransform,
    mark: IAutoMovieVector3,
    edge: IAutoMovieVector3,
  ): void {
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      initial.rotation,
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    );
    const twisted: IAutoMovieRigidTransform = {
      rotation,
      position: Vector3.subtract(
        point(initial, mark),
        Quaternion.rotateVector(rotation, mark),
      ),
    };
    TestValidator.predicate(
      "a twist invisible to both markers exceeds the rigid grip bound",
      Vector3.distance(point(initial, mark), point(twisted, mark)) <= 1e-9 &&
        Vector3.distance(point(initial, edge), point(twisted, edge)) <= 1e-9 &&
        drift(initial, twisted, mark, edge) > 0.001,
    );
  }

  /**
   * Place a material point by the public rigid transform.
   *
   * @param frame The rigid frame.
   * @param local The point in that frame, metres.
   * @returns The point in the frame's parent, metres.
   */
  export function point(
    frame: IAutoMovieRigidTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  }
}
