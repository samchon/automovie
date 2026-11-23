import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * The integration of one extended position-based dynamics substep
 * (Mueller, Macklin, Chentanez, Jeschke and Kim 2020, Algorithm 2): the
 * prediction before the position passes and the velocity derivation after
 * them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two phases and their source.
 * @evidence contracts/development/design.md#principled-representation A namespace over one body and the substep, SI units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Called by AutoMovieXpbdWorld.step for every body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Gravity and the substep are the world's; nothing is tuned here.
 */
export namespace AutoMovieXpbdIntegration {
  /**
   * Integrate one body's velocities and predict its pose; carry a
   * kinematic body to its set pose. The previous pose is kept for the
   * derivation: velocities gain gravity and the accumulated wrench over the
   * substep, the angular one with the gyroscopic term `w x I w`, then the
   * pose advances by them, the orientation by `q + 1/2 h [w, 0] q`
   * normalized.
   *
   * @param body The body.
   * @param gravity World gravitational acceleration, metres per second squared.
   * @param h The substep, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the kept pose, both velocity updates and the pose prediction.
   * @evidence contracts/development/implementation.md#principled-implementation Mueller et al. 2020, Algorithm 2, lines 3 to 9: symplectic Euler on velocities, then positions, the quaternion advanced by its derivative and normalized.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keep the pose; a kinematic body is placed and derived; a dynamic body integrates.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A massless body takes no force acceleration instead of dividing by zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per body.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each substep starts from the body's new state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the body; allocates only transient vectors.
   */
  export function predict(
    body: AutoMovieXpbdBody,
    gravity: IAutoMovieVector3,
    h: number,
  ): void {
    body.previousCenter = { ...body.center };
    body.previousOrientation = { ...body.orientation };
    if (!body.dynamic) {
      if (body.next !== undefined) {
        body.place(body.next.position, body.next.rotation);
        body.next = undefined;
      }
      derive(body, h);
      return;
    }
    const m: number = body.mass();
    body.velocity = Vector3.add(
      body.velocity,
      Vector3.scale(
        Vector3.add(
          Vector3.scale(gravity, body.gravityScale),
          m > 0 ? Vector3.scale(body.force, 1 / m) : { x: 0, y: 0, z: 0 },
        ),
        h,
      ),
    );
    const spin: IAutoMovieVector3 = body.angularVelocity;
    body.angularVelocity = Vector3.add(
      spin,
      Vector3.scale(
        body.inverseInertia(
          Vector3.subtract(
            body.torque,
            Vector3.cross(spin, body.worldInertia(spin)),
          ),
        ),
        h,
      ),
    );
    body.center = Vector3.add(body.center, Vector3.scale(body.velocity, h));
    const w: IAutoMovieVector3 = Vector3.scale(body.angularVelocity, 0.5 * h);
    const q: IAutoMovieQuaternion = body.orientation;
    const dq: IAutoMovieQuaternion = Quaternion.multiply(
      { x: w.x, y: w.y, z: w.z, w: 0 },
      q,
    );
    body.orientation = Quaternion.normalize({
      x: q.x + dq.x,
      y: q.y + dq.y,
      z: q.z + dq.z,
      w: q.w + dq.w,
    });
  }

  /**
   * Re-derive a body's velocities from its pose change over the substep:
   * `v = dx / h`, `w = 2 vec(dq q^-1) / h` on the shorter arc.
   *
   * @param body The body.
   * @param h The substep, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both formulas.
   * @evidence contracts/development/implementation.md#principled-implementation Mueller et al. 2020, Algorithm 2, lines 12 to 15.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One linear and one angular formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The sign of the quaternion difference picks the shorter arc; no other case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per body.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body's two poses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the body's velocities.
   */
  export function derive(body: AutoMovieXpbdBody, h: number): void {
    body.velocity = Vector3.scale(
      Vector3.subtract(body.center, body.previousCenter),
      1 / h,
    );
    const dq: IAutoMovieQuaternion = Quaternion.multiply(
      body.orientation,
      Quaternion.inverse(body.previousOrientation),
    );
    const sign: number = dq.w < 0 ? -1 : 1;
    body.angularVelocity = {
      x: (2 * sign * dq.x) / h,
      y: (2 * sign * dq.y) / h,
      z: (2 * sign * dq.z) / h,
    };
  }
}
