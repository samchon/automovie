import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { aimRotation } from "../kinematics/aimRotation";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";
import { projectileDragFlight } from "./projectileDragFlight";

const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;

/** A projectile model faces +Z; a velocity attitude turns that onto the flight. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** The identity rotation, a launch rotation left unstated. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

const assertFiniteVector: (name: string, vector: IAutoMovieVector3) => void = (
  name: string,
  vector: IAutoMovieVector3,
): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(vector[axis]))
      throw new RangeError(
        `projectile ${name}.${axis} must be finite, but was ${vector[axis]}`,
      );
};

/**
 * Evaluate a {@link IAutoMovieProjectile} at time `t` seconds. Without drag,
 * the closed form with no integration error: `p = origin + v·t + ½·g·t²`,
 * `v(t) = v + g·t`. With drag, the integrated flight of
 * {@link projectileDragFlight}, which holds the launch state before `t = 0`.
 * With an attitude, the state also carries the body's rotation: the model's
 * `+Z` turned onto the velocity, the launch rotation turned about the spin
 * axis by the rate times `t`, or the launch rotation kept.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Evaluate p0+v0*t+g*t^2/2 and v0+g*t for constant world acceleration, or read the quadratic-drag flight integrated by the engine's one integrator; a spin is the launch rotation composed with the rotation about the body axis by rate*t. Inputs and time must be finite; finite arithmetic can still overflow, and negative finite time evaluates the closed form backwards.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on drag for the centre and one on the attitude's kind for the rotation; the integration lives in its own owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Gravity, launch, drag and spin are caller inputs rather than actor-specific constants; invalid components throw instead of returning a fabricated state. Without drag and attitude the record returned is the one this function always returned, bit for bit.
 * @evidence contracts/development/common.md#meaningful-documentation Docs give metre, second and metre-per-second-squared units, the drag branch, the attitudes, fresh vectors and finite admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of vector operations per instant without drag; with drag, a memoised flight's chunk lookup and Hermite read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A drag flight is integrated once per projectile record by its owner and read by every call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each state transfers to the caller; the drag flight is held weakly by its record.
 */
export const projectileAt: (
  p: IAutoMovieProjectile,
  t: number,
) => IAutoMovieProjectileState = (
  p: IAutoMovieProjectile,
  t: number,
): IAutoMovieProjectileState => {
  if (!Number.isFinite(t))
    throw new RangeError(`projectile time must be finite, but was ${t}`);
  assertFiniteVector("origin", p.origin);
  assertFiniteVector("velocity", p.velocity);
  assertFiniteVector("gravity", p.gravity);

  const state: IAutoMovieProjectileState =
    p.drag === undefined
      ? {
          position: Vector3.add(
            Vector3.add(p.origin, Vector3.scale(p.velocity, t)),
            Vector3.scale(p.gravity, 0.5 * t * t),
          ),
          velocity: Vector3.add(p.velocity, Vector3.scale(p.gravity, t)),
        }
      : projectileDragFlight(p).at(t);
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
      assertFiniteVector("attitude axis", p.attitude.axis);
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
};
