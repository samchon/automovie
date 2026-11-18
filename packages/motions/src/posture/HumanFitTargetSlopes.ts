import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Angular error derivatives of one target on one unchanged body reading.
 * Each variable produces its full vector once; the target-row owner selects
 * its Cartesian or transverse components and applies solved-unit scaling.
 *
 * @evidence contracts/development/design.md#principled-representation Groups the existing inverse-right-SO(3)-Jacobian and planar-normal derivatives, in radians per variable unit on the shared target frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanFitTargets.rows consumes both vector-column producers for its rotation and normal axes; no action vocabulary or public barrel API is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses current geometric invariants without changing a singularity test, small-angle formula, axis choice or tolerance.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frame, units, full-column reuse and the row owner's remaining scaling responsibility.
 */
export namespace HumanFitTargetSlopes {
  /**
   * Derivatives of -Log(goal current^-1), using the inverse right Jacobian
   * of SO(3) (Sola et al. 2018, arXiv:1812.01537, equation 117).
   *
   * @param e The current target rotation error, in target-frame radians.
   * @param motions Relative angular velocities in that same frame, in variable order.
   * @returns One full derivative vector per variable, before solved-unit scaling.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies omega + 0.5*(e cross omega) + factor*(e cross (e cross omega)), the existing inverse-right-Jacobian formula and its inherited small-angle series.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Computes the error norm and scalar coefficient once, then maps each angular velocity to its complete three-component derivative.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every original vector operation, multiplication association and Number.EPSILON-based branch; no derivative or small coefficient is dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n) time and O(n) vector storage for n motions, computing each full column once instead of once per selected axis; speed is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the unchanged e norm and coefficient across motions and each resulting vector across the row owner's three axes; the next reading produces new columns.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns caller-owned vectors without retaining e or motions; the row builder releases the temporary columns after producing scalar coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation States the source, frame, units, ordering, inherited series and temporary output lifetime.
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
   * @param motions Relative angular velocities in that frame, in variable order.
   * @returns Full normal-error derivative vectors, before transverse projection and solved-unit scaling.
   * @throws {Error} For an antiparallel starting normal when a derivative is requested.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing analytic derivatives of the normalized cross axis and atan2 angle; the parallel case projects omega onto the transverse plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares normal geometry once, retains the original parallel/antiparallel branch, then maps each angular velocity to its complete derivative.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the inherited sqrt(Number.EPSILON) test, antiparallel refusal and exact arithmetic expressions; an empty motion list requests no derivative and preserves the former no-refusal behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n) time and O(n) vector storage, sharing normalized normals, sine/cosine and angle and producing one column for both transverse axes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only invariants of this target, current rotation and motion list are shared; each new body reading or variable list recomputes its actual columns.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates only temporary geometry and returned vectors for this row build, retaining no target, rotation or motion state globally.
   * @evidence contracts/development/common.md#meaningful-documentation States the analytic method, target-frame units, projection owner, degeneracies, empty-list behavior and ownership.
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
