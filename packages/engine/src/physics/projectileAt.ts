import { aimRotation } from "../kinematics/aimRotation";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";

/**
 * Evaluate a {@link IAutoMovieProjectile} at time `t` seconds (closed form, no
 * integration error): `p = origin + v·t + ½·g·t²`, `v(t) = v + g·t`. The
 * velocity also gives the flight direction, so a renderer can orient the arrow
 * along its arc (e.g. via `aimRotation`).
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Evaluates the declared analytic path without integration drift.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Samples the supported trajectory tier at an absolute time.
 * @author Samchon
 */
export const projectileAt = (
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

const assertFiniteVector = (name: string, vector: IAutoMovieVector3): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(vector[axis]))
      throw new RangeError(
        `projectile ${name}.${axis} must be finite, but was ${vector[axis]}`,
      );
};
