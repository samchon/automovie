import { AutoMovieGravity, Vector3, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `projectileAt` with quadratic drag (#3478): the flight read from the
 * engine's one integrator.
 *
 * Scenarios:
 *
 * 1. With a drag coefficient of zero the integrated flight equals the closed
 *    form within 1e-9 m at 20 instants over 2 s.
 * 2. A sphere of 2.72 kg and 0.093 m diameter (a 6-pounder's round shot,
 *    provisional sizes) launched at 439 m/s (M1841 6-pounder, provisional)
 *    with a sphere's drag coefficient of 0.47 loses speed monotonically over
 *    its first second.
 * 3. Its range at 5 degrees over level ground is shorter than the drag-free
 *    range.
 * 4. Two reads of two equal records are bit-identical.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates zero drag against the closed form, a heavy shot's speed loss and range, and replay; a drag of the wrong sign, a step too coarse or an order-dependent read fails one.
 * @evidence contracts/development/testing.md#independent-expectations The closed form p0+v0t+gt²/2 is written here; the range comparison needs no solver; the round-shot sizes are the issue's provisional figures.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts zero drag, real drag, and a repeat read.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls the engine's flight reader directly.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four numbered scenarios with their inputs and bounds.
 */
export function test_physics_projectile_drag(): void {
  // 1. Zero drag reproduces the closed form.
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const velocity: IAutoMovieVector3 = { x: 12, y: 9, z: -3 };
  const still: IAutoMovieProjectile = {
    origin,
    velocity,
    gravity: AutoMovieGravity.DOWN,
    drag: { coefficient: 0, area: 0.01, mass: 1 },
  };
  let worst: number = 0;
  for (let k: number = 0; k <= 20; k++) {
    const t: number = (2 * k) / 20;
    const closed: IAutoMovieVector3 = Vector3.add(
      Vector3.add(origin, Vector3.scale(velocity, t)),
      Vector3.scale(AutoMovieGravity.DOWN, 0.5 * t * t),
    );
    worst = Math.max(
      worst,
      Vector3.length(Vector3.subtract(projectileAt(still, t).position, closed)),
    );
  }
  TestValidator.predicate(
    `zero drag matches the closed form (worst ${worst.toExponential(2)} m)`,
    worst <= 1e-9,
  );

  // 2. A round shot slows.
  const radius: number = 0.093 / 2;
  const angle: number = (5 * Math.PI) / 180;
  const shot = (drag: boolean): IAutoMovieProjectile => ({
    origin: { x: 0, y: 1, z: 0 },
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
  let monotone: boolean = true;
  for (let k: number = 0; k <= 50; k++) {
    const speed: number = Vector3.length(
      projectileAt(dragged, k / 50).velocity,
    );
    monotone &&= speed < previous;
    previous = speed;
  }
  TestValidator.predicate("the shot loses speed monotonically", monotone);

  // 3. Range: where each flight comes back to its launch height.
  const range = (p: IAutoMovieProjectile): number => {
    let t: number = 0.01;
    while (projectileAt(p, t).position.y > 1 && t < 60) t += 0.01;
    return projectileAt(p, t).position.z;
  };
  const free: number = range(shot(false));
  const slowed: number = range(dragged);
  TestValidator.predicate(
    `drag shortens the range (${slowed.toFixed(1)} m against ${free.toFixed(1)} m)`,
    slowed < free,
  );

  // 4. Replay.
  const again: IAutoMovieProjectile = shot(true);
  const a: IAutoMovieVector3 = projectileAt(dragged, 1.37).position;
  const b: IAutoMovieVector3 = projectileAt(again, 1.37).position;
  TestValidator.predicate(
    "two equal records read bit-identically",
    a.x === b.x && a.y === b.y && a.z === b.z,
  );
}
