import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;

const assertFiniteVector: (name: string, vector: IAutoMovieVector3) => void = (name: string, vector: IAutoMovieVector3): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(vector[axis]))
      throw new RangeError(
        `projectile ${name}.${axis} must be finite, but was ${vector[axis]}`,
      );
};

/**
 * Evaluate a {@link IAutoMovieProjectile} at time `t` seconds (closed form, no
 * integration error): `p = origin + v·t + ½·g·t²`, `v(t) = v + g·t`. The
 * velocity also gives the flight direction, so a renderer can orient the arrow
 * along its arc (e.g. via `aimRotation`).
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Evaluate p0+v0*t+g*t^2/2 and v0+g*t for constant world acceleration. Inputs and time must be finite; finite arithmetic can still overflow, and negative finite time evaluates the same equations backwards.
 * @evidence contracts/common.md#clear-and-simple-design One analytic state evaluation is shared by launch and trajectory callers, avoiding an integration state machine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gravity and launch vectors are caller inputs rather than actor-specific constants; invalid components throw instead of returning a fabricated state.
 * @evidence contracts/common.md#meaningful-documentation Docs give metre, second and metre-per-second-squared units, fresh vectors, finite admission and constant-acceleration scope.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of vector scalar operations gives O(1) time and two output vectors per instant.
 * @evidence contracts/performance.md#reuse-equivalent-work Trajectory and collision sampling reuse this equation owner, not results across mutable projectile/time pairs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each state transfers to the caller; the launch record is borrowed and no integration history or resource is retained.
 */
export const projectileAt: (p: IAutoMovieProjectile, t: number) => IAutoMovieProjectileState = (
  p: IAutoMovieProjectile,
  t: number,
): IAutoMovieProjectileState => {
  if (!Number.isFinite(t))
    throw new RangeError(`projectile time must be finite, but was ${t}`);
  assertFiniteVector("origin", p.origin);
  assertFiniteVector("velocity", p.velocity);
  assertFiniteVector("gravity", p.gravity);

  return {
    position: Vector3.add(
      Vector3.add(p.origin, Vector3.scale(p.velocity, t)),
      Vector3.scale(p.gravity, 0.5 * t * t),
    ),
    velocity: Vector3.add(p.velocity, Vector3.scale(p.gravity, t)),
  };
};
