import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "./AutoMovieEngineXpbdBody";

/**
 * The integration of one extended position-based dynamics substep (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, Algorithm 2): the prediction before
 * the position passes and the velocity derivation after them.
 */
export namespace AutoMovieEngineXpbdIntegration {
  /**
   * Integrate one body's velocities and predict its pose; carry a kinematic
   * body to its set pose. The previous pose is kept for the derivation:
   * velocities gain gravity and the accumulated wrench over the substep, the
   * angular one with the gyroscopic term `w x I w`, then the pose advances by
   * them, the orientation by `q + 1/2 h [w, 0] q` normalized.
   *
   * @param body The body.
   * @param gravity World gravitational acceleration, metres per second squared.
   * @param h The substep, seconds.
   */
  export function predict(
    body: AutoMovieEngineXpbdBody,
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
    body.velocity = AutoMovieEngineVector3.add(
      body.velocity,
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(gravity, body.gravityScale),
          m > 0 ? AutoMovieEngineVector3.scale(body.force, 1 / m) : { x: 0, y: 0, z: 0 },
        ),
        h,
      ),
    );
    const spin: IAutoMovieVector3 = body.angularVelocity;
    body.angularVelocity = AutoMovieEngineVector3.add(
      spin,
      AutoMovieEngineVector3.scale(
        body.inverseInertia(
          AutoMovieEngineVector3.subtract(
            body.torque,
            AutoMovieEngineVector3.cross(spin, body.worldInertia(spin)),
          ),
        ),
        h,
      ),
    );
    body.center = AutoMovieEngineVector3.add(body.center, AutoMovieEngineVector3.scale(body.velocity, h));
    const w: IAutoMovieVector3 = AutoMovieEngineVector3.scale(body.angularVelocity, 0.5 * h);
    const q: IAutoMovieQuaternion = body.orientation;
    const dq: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      { x: w.x, y: w.y, z: w.z, w: 0 },
      q,
    );
    body.orientation = AutoMovieEngineQuaternion.normalize({
      x: q.x + dq.x,
      y: q.y + dq.y,
      z: q.z + dq.z,
      w: q.w + dq.w,
    });
  }

  /**
   * Re-derive a body's velocities from its pose change over the substep: `v =
   * dx / h`, `w = 2 vec(dq q^-1) / h` on the shorter arc.
   *
   * @param body The body.
   * @param h The substep, seconds.
   */
  export function derive(body: AutoMovieEngineXpbdBody, h: number): void {
    body.velocity = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(body.center, body.previousCenter),
      1 / h,
    );
    const dq: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      body.orientation,
      AutoMovieEngineQuaternion.inverse(body.previousOrientation),
    );
    const sign: number = dq.w < 0 ? -1 : 1;
    body.angularVelocity = {
      x: (2 * sign * dq.x) / h,
      y: (2 * sign * dq.y) / h,
      z: (2 * sign * dq.z) / h,
    };
  }
}
