import {
  AutoMovieGravity,
  type IAutoMovieHit,
  type IAutoMovieProjectile,
  Vector3,
  projectileContinue,
  projectileFirstContact,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A projectile's continuation after a contact (#3478): bounce, roll, stick.
 *
 * Scenarios:
 *
 * 1. A ball dropped from 1 m with restitution 0.5 rebounds to 0.25 m within
 *    1 mm (the rebound speed is half the impact speed, so the height a
 *    quarter).
 * 2. With radius 0.0365 m, the third impact becomes a roll: successive
 *    candidate rebound heights are 0.25, 0.0625 and 0.015625 m. Each search
 *    starts at zero and names the resolved floor, preserving later reentry.
 * 3. A ball touching down at 2 m/s along level ground with a rolling
 *    resistance of 0.1 stops `v^2 / (2 c g)` beyond where it touched down,
 *    to the float resolution of the closed form, and at rest.
 * 4. A stick rests the point `depth` on along the velocity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Bounces, rolls and sticks read back through the continuation's own reader; a wrong restitution, a roll that never stops or a stick off the line fails.
 * @evidence contracts/development/testing.md#independent-expectations The rebound height e²h, the three explicit heights straddling the radius and the stopping distance v²/(2cg) are written here. Three impacts are derived from those heights, not a production bounce cap.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a bounce, a chain of bounces into a roll, a roll and a stick.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls the engine's contact and continuation directly.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four numbered scenarios with their inputs and bounds.
 */
export function test_physics_projectile_bounce(): void {
  const ground: projectileFirstContact.ICollider = projectileFirstContact.plane(
    "ground",
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  );
  const drop: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    gravity: AutoMovieGravity.DOWN,
  };
  const first = (p: IAutoMovieProjectile): IAutoMovieHit =>
    projectileFirstContact(
      p,
      [ground],
      { from: 0, to: 5 },
      {
        departing: ground.id,
        radius: 0,
        thickness: 0.05,
      },
    )!;

  // 1. Half the speed, a quarter of the height.
  const hit: IAutoMovieHit = first(drop);
  const after: projectileContinue.Segment = projectileContinue(drop, hit, {
    kind: "bounce",
    restitution: 0.5,
    friction: 0,
  });
  const rebound: number =
    after.kind === "flight"
      ? after.projectile.velocity.y ** 2 / (2 * AutoMovieGravity.STANDARD)
      : NaN;
  TestValidator.predicate(
    `the ball rebounds to a quarter of its height (${rebound.toFixed(4)} m)`,
    Math.abs(rebound - 0.25) <= 1e-3,
  );

  // 2. The first two rebound heights exceed the radius; the third does not.
  let current: IAutoMovieProjectile = {
    ...drop,
    velocity: { x: 1, y: 0, z: 0 },
  };
  let rolled: boolean = false;
  for (let k: number = 0; k < 3; k++) {
    const next: projectileContinue.Segment = projectileContinue(
      current,
      first(current),
      {
        kind: "bounce",
        restitution: 0.5,
        friction: 0,
        roll: { radius: 0.0365, resistance: 0.1 },
      },
    );
    TestValidator.predicate(
      `impact ${k + 1} follows its e²h/radius comparison`,
      k < 2 ? next.kind === "flight" : next.kind === "roll",
    );
    if (next.kind === "roll") rolled = true;
    else if (next.kind === "flight") current = next.projectile;
  }
  TestValidator.predicate("the bounces end in a roll", rolled);

  // 3. A roll stops at v²/(2cg).
  const rolling: projectileContinue.Segment = projectileContinue(
    {
      ...drop,
      origin: { x: 0, y: 0.0001, z: 0 },
      velocity: { x: 2, y: -0.01, z: 0 },
    },
    first({
      ...drop,
      origin: { x: 0, y: 0.0001, z: 0 },
      velocity: { x: 2, y: -0.01, z: 0 },
    }),
    { kind: "roll", resistance: 0.1 },
  );
  // The roll starts where the ball touched down, with its speed along the
  // ground there (2 m/s, gravity having no horizontal part).
  const start: number = rolling.kind === "roll" ? rolling.origin.x : NaN;
  const stop: number = start + (2 * 2) / (2 * 0.1 * AutoMovieGravity.STANDARD);
  const rest = projectileContinue.at(rolling, 100);
  // The closed form's few operations at float resolution.
  const resolution: number = Number.EPSILON * stop * 2 ** 4;
  TestValidator.predicate(
    `the roll stops where v²/(2cg) from its start puts it (${rest.position.x.toFixed(6)} of ${stop.toFixed(6)} m)`,
    Math.abs(rest.position.x - stop) <= resolution &&
      Vector3.length(rest.velocity) === 0,
  );

  // 4. A stick rests on along the velocity.
  const stuck: projectileContinue.Segment = projectileContinue(drop, hit, {
    kind: "stick",
    depth: 0.02,
  });
  TestValidator.predicate(
    "a stick rests its point the depth on along the velocity",
    stuck.kind === "rest" && Math.abs(stuck.position.y - -0.02) <= 1e-4,
  );
}
