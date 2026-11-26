import { AutoMovieGravity, Quaternion, Vector3, AutoMovieAir } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/predicates";

/** Rounding of a few closed-form products, metres and radians. */
const ROUNDING: number = 1e-9;

/**
 * `projectileAt` reads a flight at a second: the closed form `p = origin + v t
 *
 * - G t^2 / 2`, `v(t) = v + g t` without drag, the engine's integrator with
 *   quadratic drag, and the body's attitude, a spin at its rate or the nose
 *   along the velocity, which leaves the centre's path as it is.
 *
 * Scenarios:
 *
 * 1. Under (0, -10, 0) from (0, 10, 0) at (5, 0, 0), after 1 s the body is at (5,
 *    5, 0) moving (5, -10, 0); a throw straight up at 10 tops out at 1 s, 5 m
 *    up, at rest; at 0 s the state is the launch.
 * 2. A drag coefficient of 0 equals the closed form at 21 instants over 2 s; a
 *    2.72 kg, 0.093 m round shot at 439 m/s with coefficient 0.47 slows
 *    monotonically over its first second, falls short of the drag-free range at
 *    5 degrees, and reads bit-identically twice.
 * 3. A spin of 720 degrees a second about +X turns +Y back on itself in 1 s and a
 *    quarter turn in 0.125 s, its centre that of a velocity attitude, whose +Z
 *    points along the velocity.
 */
export function test_engine_physics_projectile_at(): void {
  // 1. The closed form.
  const g: IAutoMovieVector3 = { x: 0, y: -10, z: 0 };
  const arc = AutoMovieAir.projectileAt(
    {
      origin: { x: 0, y: 10, z: 0 },
      velocity: { x: 5, y: 0, z: 0 },
      gravity: g,
    },
    1,
  );
  const apex = AutoMovieAir.projectileAt(
    {
      origin: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 10, z: 0 },
      gravity: g,
    },
    1,
  );
  const start = AutoMovieAir.projectileAt(
    {
      origin: { x: 1, y: 2, z: 3 },
      velocity: { x: 4, y: 5, z: 6 },
      gravity: g,
    },
    0,
  );
  TestValidator.predicate(
    "the closed form",
    vclose(arc.position, { x: 5, y: 5, z: 0 }, ROUNDING) &&
      vclose(arc.velocity, { x: 5, y: -10, z: 0 }, ROUNDING) &&
      vclose(apex.position, { x: 0, y: 5, z: 0 }, ROUNDING) &&
      vclose(apex.velocity, { x: 0, y: 0, z: 0 }, ROUNDING) &&
      vclose(start.position, { x: 1, y: 2, z: 3 }, ROUNDING) &&
      vclose(start.velocity, { x: 4, y: 5, z: 6 }, ROUNDING),
  );

  // 2. Drag.
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const velocity: IAutoMovieVector3 = { x: 12, y: 9, z: -3 };
  const zero: IAutoMovieProjectile = {
    origin,
    velocity,
    gravity: AutoMovieGravity.DOWN,
    drag: { coefficient: 0, area: 0.01, mass: 1 },
  };
  let matched: boolean = true;
  for (let k: number = 0; k <= 20; k++) {
    const t: number = k / 10;
    matched &&= vclose(
      AutoMovieAir.projectileAt(zero, t).position,
      Vector3.add(
        Vector3.add(origin, Vector3.scale(velocity, t)),
        Vector3.scale(AutoMovieGravity.DOWN, 0.5 * t * t),
      ),
      ROUNDING,
    );
  }
  TestValidator.predicate("no drag is the closed form", matched);
  const radius: number = 0.093 / 2;
  const angle: number = (5 * Math.PI) / 180;
  const shot = (drag: boolean): IAutoMovieProjectile => ({
    origin,
    velocity: { x: 0, y: 439 * Math.sin(angle), z: 439 * Math.cos(angle) },
    gravity: AutoMovieGravity.DOWN,
    ...(drag
      ? {
          drag: {
            coefficient: 0.47,
            area: Math.PI * radius * radius,
            mass: 2.72,
          },
        }
      : {}),
  });
  const dragged: IAutoMovieProjectile = shot(true);
  let previous: number = Infinity;
  let slowing: boolean = true;
  for (let k: number = 0; k <= 50; k++) {
    const speed: number = Vector3.length(
      AutoMovieAir.projectileAt(dragged, k / 50).velocity,
    );
    slowing &&= speed < previous;
    previous = speed;
  }
  const range = (p: IAutoMovieProjectile): number => {
    let t: number = 0.01;
    while (AutoMovieAir.projectileAt(p, t).position.y > 1 && t < 60) t += 0.01;
    return AutoMovieAir.projectileAt(p, t).position.z;
  };
  const a: IAutoMovieVector3 = AutoMovieAir.projectileAt(dragged, 1.37).position;
  const b: IAutoMovieVector3 = AutoMovieAir.projectileAt(shot(true), 1.37).position;
  TestValidator.predicate(
    "drag slows and shortens, the same every read",
    slowing &&
      range(dragged) < range(shot(false)) &&
      a.x === b.x &&
      a.y === b.y &&
      a.z === b.z,
  );

  // 3. The attitude.
  const launch = {
    origin: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 0, y: 3, z: 9 },
    gravity: AutoMovieGravity.DOWN,
  };
  const spun: IAutoMovieProjectile = {
    ...launch,
    attitude: { kind: "spin", axis: { x: 1, y: 0, z: 0 }, rate: 720 },
  };
  const nosed: IAutoMovieProjectile = {
    ...launch,
    attitude: { kind: "velocity" },
  };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const turned = (t: number): number =>
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(
            Quaternion.rotateVector(AutoMovieAir.projectileAt(spun, t).rotation!, up),
            up,
          ),
        ),
      ),
    );
  let sameCentre: boolean = true;
  for (let k: number = 0; k < 10; k++)
    sameCentre &&=
      Vector3.length(
        Vector3.subtract(
          AutoMovieAir.projectileAt(spun, k / 10).position,
          AutoMovieAir.projectileAt(nosed, k / 10).position,
        ),
      ) === 0;
  const state = AutoMovieAir.projectileAt(nosed, 0.4);
  TestValidator.predicate(
    "the attitude",
    turned(1) <= ROUNDING &&
      Math.abs(turned(0.125) - Math.PI / 2) <= ROUNDING &&
      sameCentre &&
      Vector3.dot(
        Quaternion.rotateVector(state.rotation!, { x: 0, y: 0, z: 1 }),
        Vector3.normalize(state.velocity),
      ) >=
        1 - ROUNDING,
  );
}
