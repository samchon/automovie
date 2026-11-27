import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Angular error derivatives of one target on one unchanged body reading. Each
 * variable produces its full vector once; the target-row owner selects its
 * Cartesian or transverse components and applies solved-unit scaling.
 */
export namespace HumanFitTargetSlopes {
  /*
   * Derivatives of -Log(goal current^-1), using the inverse right Jacobian of
   * SO(3) (Sola et al. 2018, arXiv:1812.01537, equation 117).
   * Parameter e: The current target rotation error, in target-frame radians.
   * Parameter motions: Relative angular velocities in that same frame, in variable
   * order.
   * Returns: One full derivative vector per variable, before solved-unit
   * scaling.
   */
  export function rotation(
    e: IAutoMovieVector3,
    motions: readonly IAutoMovieMotionHumanJacobian.ITwist[],
  ): IAutoMovieVector3[] {
    if (motions.length === 0) return [];
    const angle: number = AutoMovieEngineVector3.length(e);
    const factor: number =
      angle < Number.EPSILON ** 0.25
        ? 1 / 12 + (angle * angle) / 720
        : 1 / (angle * angle) - 1 / (2 * angle * Math.tan(angle / 2));
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 => {
        const omega: IAutoMovieVector3 = motion.angular;
        const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(e, omega);
        return AutoMovieEngineVector3.add(
          omega,
          AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.scale(cross, 0.5),
            AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(e, cross), factor),
          ),
        );
      },
    );
  }

  /*
   * Derivatives of the least turn between the goal and effector normals:
   * differentiate atan2 of cross length and dot, and its turn axis together.
   * Parameter goal: The requested local effector and goal-frame normal directions.
   * Parameter rotation: Current effector rotation in the target frame.
   * Parameter motions: Relative angular velocities in that frame, in variable
   * order.
   * Returns: Full normal-error derivative vectors, before transverse projection
   * and solved-unit scaling.
   * For an antiparallel starting normal when a derivative is
   * requested.
   */
  export function normal(
    goal: NonNullable<IAutoMovieMotionHumanBodyFitTypes.ITarget["normal"]>,
    rotation: IAutoMovieQuaternion,
    motions: readonly IAutoMovieMotionHumanJacobian.ITwist[],
  ): IAutoMovieVector3[] {
    if (motions.length === 0) return [];
    const w: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(goal.world);
    const n: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineQuaternion.rotateVector(rotation, goal.local),
    );
    const c: IAutoMovieVector3 = AutoMovieEngineVector3.cross(w, n);
    const sine: number = AutoMovieEngineVector3.length(c);
    const cosine: number = AutoMovieEngineVector3.dot(w, n);
    if (sine < Math.sqrt(Number.EPSILON)) {
      if (cosine < 0)
        throw new Error(
          "A planar-normal fit needs a non-antiparallel starting normal",
        );
      return motions.map(
        (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 =>
          AutoMovieEngineVector3.subtract(
            motion.angular,
            AutoMovieEngineVector3.scale(w, AutoMovieEngineVector3.dot(w, motion.angular)),
          ),
      );
    }
    const angle: number = Math.atan2(sine, cosine);
    return motions.map(
      (motion: IAutoMovieMotionHumanJacobian.ITwist): IAutoMovieVector3 => {
        const dn: IAutoMovieVector3 = AutoMovieEngineVector3.cross(motion.angular, n);
        const dc: IAutoMovieVector3 = AutoMovieEngineVector3.cross(w, dn);
        const ds: number = AutoMovieEngineVector3.dot(c, dc) / sine;
        const dt: number = cosine * ds - sine * AutoMovieEngineVector3.dot(w, dn);
        return AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(dc, angle / sine),
          AutoMovieEngineVector3.scale(c, dt / sine - (angle * ds) / (sine * sine)),
        );
      },
    );
  }
}
