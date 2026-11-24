import {
  AutoMovieGravity,
  Vector3,
  projectileContinue,
  projectileFirstContact,
} from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileFirstContact,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A projectile's continuation after a contact (#3478): bounce, roll, stick and
 * pass.
 *
 * Scenarios:
 *
 * 1. A ball dropped from 1 m with restitution 0.5 rebounds to 0.25 m within 1 mm
 *    (the rebound speed is half the impact speed, so the height a quarter).
 * 2. With radius 0.0365 m, the third impact becomes a roll: successive candidate
 *    rebound heights are 0.25, 0.0625 and 0.015625 m. Each search starts at
 *    zero and names the resolved floor, preserving later reentry.
 * 3. A ball touching down at 2 m/s along level ground with a rolling resistance of
 *    0.1 stops `v^2 / (2 c g)` beyond where it touched down, to the float
 *    resolution of the closed form, and at rest.
 * 4. A stick rests the point `depth` on along the velocity.
 * 5. Restitution and speed loss reject negative, greater-than-one and nonfinite
 *    values, preserve exact endpoints and the half-share response, while
 *    friction, rolling resistance and embedding depth above one remain admitted
 *    under their separate nonnegative domains.
 * 6. A thin shell of radius 0.1 m (gyration 2/3) striking level ground at (3, -1,
 *    0) m/s with restitution 0.5 and friction 1 grips: friction stops at
 *    rolling, so it leaves at 3 * 3/5 = 1.8 m/s along the ground, turning at 18
 *    rad/s, and its next bounce with that spin keeps 1.8 m/s. With friction 0.2
 *    it slides throughout and keeps 3 - 0.2 * 1.5 = 2.7 m/s. A ball falling at
 *    1 m/s onto a surface rising at 2 m/s leaves at 2
 *
 *    - 0.5 * 3 = 3.5 m/s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Bounces, rolls, sticks and passes read actual continuation outputs. Both bounded shares must refuse unsupported inputs, while zero/one/interior responses and the other coefficients' unbounded nonnegative domains remain observable.
 * @evidence contracts/development/testing.md#independent-expectations The rebound height e²h, the three explicit heights straddling the radius and the stopping distance v²/(2cg) are written here. Three impacts are derived from those heights, not a production bounce cap. An incoming (2,-1,0) becomes (2,e,0) under frictionless restitution e, or (2*(1-loss),-(1-loss),0) after a pass; friction two removes its tangential speed, resistance two gives deceleration 2g and depth two embeds two metres. A rigid ball's sliding stops at J* = |s| k / (1 + k), so a gripping shell keeps 1 / (1 + 2/3) = 3/5 of it and turns at J / (k r); Newton's law on the relative normal speed gives the moving surface's 3.5 m/s.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a bounce, a chain into a roll, a roll, a stick and a pass, a gripping and a sliding ball, a spinning ball's second bounce and a moving surface; negative/upper/nonfinite share failures, exact endpoints/interior shares and values above one for the three coefficients without that upper bound.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls the engine's contact and continuation directly.
 * @evidence contracts/development/common.md#meaningful-documentation Lists six scenarios with their physical inputs, independent expectations, numeric bounds and the distinction between bounded shares and other nonnegative coefficients.
 */
export function test_physics_projectile_bounce(): void {
  const ground: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.plane(
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
  const after: IAutoMovieProjectileContinue.Segment = projectileContinue(
    drop,
    hit,
    {
      kind: "bounce",
      restitution: 0.5,
      friction: 0,
    },
  );
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
    const next: IAutoMovieProjectileContinue.Segment = projectileContinue(
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
  const rolling: IAutoMovieProjectileContinue.Segment = projectileContinue(
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
  const stuck: IAutoMovieProjectileContinue.Segment = projectileContinue(
    drop,
    hit,
    {
      kind: "stick",
      depth: 0.02,
    },
  );
  TestValidator.predicate(
    "a stick rests its point the depth on along the velocity",
    stuck.kind === "rest" && Math.abs(stuck.position.y - -0.02) <= 1e-4,
  );

  // 5. Only restitution and lost-speed shares have the unit upper bound.
  const failures: string[] = [];
  const flight: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 2, y: -1, z: 0 },
    gravity: { x: 0, y: 0, z: 0 },
  };
  const contact: IAutoMovieHit = {
    time: 0,
    point: flight.origin,
    normal: { x: 0, y: 1, z: 0 },
  };
  for (const kind of ["bounce", "pass"] as const)
    for (const value of [
      -Number.MIN_VALUE,
      1 + Number.EPSILON,
      2,
    ]) {
      const outcome: IAutoMovieProjectileContinue.Outcome =
        kind === "bounce"
          ? { kind, restitution: value, friction: 0 }
          : { kind, loss: value };
      let refused: boolean = false;
      try {
        projectileContinue(flight, contact, outcome);
      } catch (error) {
        refused = error instanceof RangeError;
      }
      if (!refused) failures.push(`${kind} share ${value} was not refused`);
    }

  /** Preserve all independent admissible-control findings in this round. */
  const accepts: (label: string, read: () => boolean) => void = (
    label: string,
    read: () => boolean,
  ): void => {
    try {
      if (!read()) failures.push(label);
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  };
  for (const kind of ["bounce", "pass"] as const)
    for (const value of [0, 0.5, 1])
      accepts(`${kind} admitted share ${value}`, (): boolean => {
        const outcome: IAutoMovieProjectileContinue.Outcome =
          kind === "bounce"
            ? { kind, restitution: value, friction: 0 }
            : { kind, loss: value };
        const continued: IAutoMovieProjectileContinue.Segment =
          projectileContinue(flight, contact, outcome);
        return (
          continued.kind === "flight" &&
          nclose(
            continued.projectile.velocity.x,
            kind === "bounce" ? 2 : 2 * (1 - value),
            0,
          ) &&
          nclose(
            continued.projectile.velocity.y,
            kind === "bounce" ? value : -(1 - value),
            0,
          )
        );
      });
  accepts("friction above one keeps its nonnegative domain", (): boolean => {
    const continued: IAutoMovieProjectileContinue.Segment = projectileContinue(
      flight,
      contact,
      {
        kind: "bounce",
        restitution: 0.5,
        friction: 2,
      },
    );
    return (
      continued.kind === "flight" &&
      nclose(continued.projectile.velocity.x, 0, 0) &&
      nclose(continued.projectile.velocity.y, 0.5, 0)
    );
  });
  accepts(
    "rolling resistance above one keeps its nonnegative domain",
    (): boolean => {
      const continued: IAutoMovieProjectileContinue.Segment =
        projectileContinue(
          { ...flight, gravity: AutoMovieGravity.DOWN },
          contact,
          { kind: "roll", resistance: 2 },
        );
      return (
        continued.kind === "roll" &&
        nclose(continued.deceleration, 2 * AutoMovieGravity.STANDARD, 0)
      );
    },
  );
  accepts(
    "embedding depth above one keeps its nonnegative domain",
    (): boolean => {
      const continued: IAutoMovieProjectileContinue.Segment =
        projectileContinue(flight, contact, {
          kind: "stick",
          depth: 2,
        });
      return (
        continued.kind === "rest" &&
        nclose(Vector3.length(continued.position), 2, 1e-12)
      );
    },
  );

  // 6. A ball's spin takes up the sliding: friction stops at rolling.
  const level: IAutoMovieHit = {
    time: 0,
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  };
  const oblique: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 3, y: -1, z: 0 },
    gravity: { x: 0, y: 0, z: 0 },
  };
  const shell: IAutoMovieProjectileContinue.IBall = {
    radius: 0.1,
    gyration: 2 / 3,
  };
  const gripped: IAutoMovieProjectileContinue.Segment = projectileContinue(
    oblique,
    level,
    { kind: "bounce", restitution: 0.5, friction: 1, ball: shell },
  );
  accepts("a gripping shell keeps 3/5 of its sliding speed", (): boolean =>
    gripped.kind === "flight"
      ? nclose(gripped.projectile.velocity.x, 1.8, 1e-12) &&
        nclose(gripped.projectile.velocity.y, 0.5, 1e-12) &&
        gripped.spin !== undefined &&
        nclose(gripped.spin.z, -18, 1e-9) &&
        nclose(gripped.spin.x, 0, 0) &&
        nclose(gripped.spin.y, 0, 0)
      : false,
  );
  accepts("a rolling shell's next bounce keeps its speed", (): boolean => {
    if (gripped.kind !== "flight" || gripped.spin === undefined) return false;
    const again: IAutoMovieProjectileContinue.Segment = projectileContinue(
      {
        ...oblique,
        velocity: { x: gripped.projectile.velocity.x, y: -1, z: 0 },
      },
      level,
      {
        kind: "bounce",
        restitution: 0.5,
        friction: 1,
        ball: { ...shell, spin: gripped.spin },
      },
    );
    return (
      again.kind === "flight" && nclose(again.projectile.velocity.x, 1.8, 1e-9)
    );
  });
  accepts("a ball that slides throughout keeps Coulomb's loss", (): boolean => {
    const slid: IAutoMovieProjectileContinue.Segment = projectileContinue(
      oblique,
      level,
      { kind: "bounce", restitution: 0.5, friction: 0.2, ball: shell },
    );
    return (
      slid.kind === "flight" && nclose(slid.projectile.velocity.x, 2.7, 1e-12)
    );
  });
  accepts(
    "a moving surface returns the ball relative to itself",
    (): boolean => {
      const struck: IAutoMovieProjectileContinue.Segment = projectileContinue(
        { ...oblique, velocity: { x: 0, y: -1, z: 0 } },
        level,
        {
          kind: "bounce",
          restitution: 0.5,
          friction: 0,
          surface: { x: 0, y: 2, z: 0 },
        },
      );
      return (
        struck.kind === "flight" && nclose(struck.projectile.velocity.y, 3.5, 0)
      );
    },
  );
  TestValidator.predicate(
    `continuation coefficient findings: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
