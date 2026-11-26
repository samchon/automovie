import type {
  IAutoMovieProjectile,
  IAutoMovieProjectileState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { aimRotation } from "../../kinematics/aimRotation";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { projectileDragFlight } from "../projectileDragFlight";

/** A projectile model faces +Z; a velocity attitude turns that onto the flight. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** The identity rotation, a launch rotation left unstated. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Evaluate a {@link IAutoMovieProjectile} at time `t` seconds. Without drag, the
 * closed form with no integration error: `p = origin + v·t + ½·g·t²`, `v(t) =
 * v
 *
 * - G·t`. With drag, the integrated flight of {@link projectileDragFlight}, which
 *   holds the launch state before `t = 0`. With an attitude, the state also
 *   carries the body's rotation: the model's `+Z`turned onto the velocity, the
 *   launch rotation turned about the spin axis by the rate times`t`, or the
 *   launch rotation kept.
 */
export function projectileAt(
  p: IAutoMovieProjectile,
  t: number,
): IAutoMovieProjectileState {
  const state: IAutoMovieProjectileState =
    p.drag === undefined
      ? {
          position: Vector3.add(
            Vector3.add(p.origin, Vector3.scale(p.velocity, t)),
            Vector3.scale(p.gravity, 0.5 * t * t),
          ),
          velocity: Vector3.add(p.velocity, Vector3.scale(p.gravity, t)),
        }
      : (p.flight ?? projectileDragFlight(p)).at(t);
  if (p.attitude === undefined) return state;
  switch (p.attitude.kind) {
    case "velocity":
      return {
        ...state,
        rotation:
          Vector3.length(state.velocity) > 0
            ? aimRotation(FORWARD, state.velocity)
            : IDENTITY,
      };
    case "spin":
      return {
        ...state,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            p.attitude.rotation ?? IDENTITY,
            Quaternion.fromAxisAngle(p.attitude.axis, p.attitude.rate * t),
          ),
        ),
      };
    case "fixed":
      return { ...state, rotation: p.attitude.rotation ?? IDENTITY };
  }
}
