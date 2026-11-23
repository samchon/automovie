import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Angular error derivatives of one target on one unchanged body reading. Each
 * variable produces its full vector once; the target-row owner selects its
 * Cartesian or transverse components and applies solved-unit scaling.
 */
export namespace HumanFitTargetSlopes {
  /**
   * Derivatives of -Log(goal current^-1), using the inverse right Jacobian of
   * SO(3) (Sola et al. 2018, arXiv:1812.01537, equation 117).
   *
   * @param e The current target rotation error, in target-frame radians.
   * @param motions Relative angular velocities in that same frame, in variable
   *   order.
   * @returns One full derivative vector per variable, before solved-unit
   *   scaling.
   */
  export function rotation(
    e: IAutoMovieVector3,
    motions: readonly IAutoMovieMotionHumanJacobian.ITwist[],
  ): IAutoMovieVector3[] {
    if (motions.length === 0) return [];
    const angle: number = Vector3.length(e);
    const factor: number =
      angle < Number.EPSILON ** 0.25
        ? 1 / 12 + (angle * angle) / 720
        : 1 / (angle * angle) - 1 / (2 * angle * Math.tan(angle / 2));
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 => {
        const omega: IAutoMovieVector3 = motion.angular;
        const cross: IAutoMovieVector3 = Vector3.cross(e, omega);
        return Vector3.add(
          omega,
          Vector3.add(
            Vector3.scale(cross, 0.5),
            Vector3.scale(Vector3.cross(e, cross), factor),
          ),
        );
      },
    );
  }

  /**
   * Derivatives of the least turn between the goal and effector normals:
   * differentiate atan2 of cross length and dot, and its turn axis together.
   *
   * @param goal The requested local effector and goal-frame normal directions.
   * @param rotation Current effector rotation in the target frame.
   * @param motions Relative angular velocities in that frame, in variable
   *   order.
   * @returns Full normal-error derivative vectors, before transverse projection
   *   and solved-unit scaling.
   * @throws {Error} For an antiparallel starting normal when a derivative is
   *   requested.
   */
  export function normal(
    goal: NonNullable<IAutoMovieMotionHumanBodyFitTypes.ITarget["normal"]>,
    rotation: IAutoMovieQuaternion,
    motions: readonly IAutoMovieMotionHumanJacobian.ITwist[],
  ): IAutoMovieVector3[] {
    if (motions.length === 0) return [];
    const w: IAutoMovieVector3 = Vector3.normalize(goal.world);
    const n: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(rotation, goal.local),
    );
    const c: IAutoMovieVector3 = Vector3.cross(w, n);
    const sine: number = Vector3.length(c);
    const cosine: number = Vector3.dot(w, n);
    if (sine < Math.sqrt(Number.EPSILON)) {
      if (cosine < 0)
        throw new Error(
          "A planar-normal fit needs a non-antiparallel starting normal",
        );
      return motions.map(
        (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 =>
          Vector3.subtract(
            motion.angular,
            Vector3.scale(w, Vector3.dot(w, motion.angular)),
          ),
      );
    }
    const angle: number = Math.atan2(sine, cosine);
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 => {
        const dn: IAutoMovieVector3 = Vector3.cross(motion.angular, n);
        const dc: IAutoMovieVector3 = Vector3.cross(w, dn);
        const ds: number = Vector3.dot(c, dc) / sine;
        const dt: number = cosine * ds - sine * Vector3.dot(w, dn);
        return Vector3.add(
          Vector3.scale(dc, angle / sine),
          Vector3.scale(c, dt / sine - (angle * ds) / (sine * sine)),
        );
      },
    );
  }
}
