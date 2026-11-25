import { projectileAt, solveBallisticLaunch } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

import { nclose, vclose } from "../../../internal/predicates";

/** Earth's gravity, metres per second squared. */
const GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

/** No gravity. */
const NONE: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** How far a forward flight may miss its target, metres. */
const LANDING: number = 1e-3;

/** How far a hit time may miss its hand-computed root, seconds. */
const ROOT: number = 1e-4;

/** A solved launch. */
type Launch = NonNullable<ReturnType<typeof solveBallisticLaunch>>;

/** Whether the solved flight is on its target at its hit time. */
function landsOn(
  origin: IAutoMovieVector3,
  launch: Launch,
  target: IAutoMovieVector3,
  gravity: IAutoMovieVector3 = GRAVITY,
  bound: number = LANDING,
): boolean {
  return vclose(
    projectileAt({ origin, velocity: launch.velocity, gravity }, launch.hitTime)
      .position,
    target,
    bound,
  );
}

/**
 * `solveBallisticLaunch` solves a fixed-speed launch onto a target: the
 * velocity and hit time whose constant-acceleration flight lands there, the
 * lower `direct` arc or the lobbed `high` one, and null where the speed cannot
 * reach.
 *
 * Scenarios, every flight re-run onto its target by `projectileAt`:
 *
 * 1. From (0, 1, 0) at speed 14 onto the level (8, 1, 3): the direct arc lands at
 *    speed 14 within 1e-6, the high arc lands later; a raised (6, 4.5, -2) and
 *    a lowered (6, -1.5, -2) target land.
 * 2. With no gravity the shot is the straight sightline; a target on the origin or
 *    a zero speed is null; a level target 100 m off at speed 8 is null.
 * 3. Straight overhead 10 m at speed 20, `disc = 400 - 2 g 10`: the direct arc
 *    fires straight up and hits at the rising root `(20 - sqrt(disc)) / g =
 *    0.5835 s`, the high arc at the falling root `(20 + sqrt(disc)) / g =
 *    3.4940 s`; 6 m overhead at speed 10, beyond `s^2 / 2g = 5.097` m, is null
 *    for both.
 * 4. Straight below 20 m at speed 20, `disc = 400 + 2 g 20`: the direct arc fires
 *    straight down and hits at `(sqrt(disc) - 20) / g = 0.8307 s`, the high arc
 *    fires up and falls past at `(20 + sqrt(disc)) / g = 4.9082 s`; 4 m below
 *    at speed 6 the direct drop hits at `(sqrt(36 + 2 g 4) - 6) / g = 0.4791
 *    s`.
 */
export function test_unit_engine_physics_solve_ballistic_launch(): void {
  // 1. A general target.
  const raised: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const level: IAutoMovieVector3 = { x: 8, y: 1, z: 3 };
  const direct: Launch = solveBallisticLaunch(raised, level, 14)!;
  const high: Launch = solveBallisticLaunch(
    raised,
    level,
    14,
    GRAVITY,
    "high",
  )!;
  const up: IAutoMovieVector3 = { x: 6, y: 4.5, z: -2 };
  const down: IAutoMovieVector3 = { x: 6, y: -1.5, z: -2 };
  TestValidator.predicate(
    "a general target",
    landsOn(raised, direct, level) &&
      nclose(
        Math.hypot(direct.velocity.x, direct.velocity.y, direct.velocity.z),
        14,
        PhysicalTolerance.CONVERGED,
      ) &&
      landsOn(raised, high, level) &&
      high.hitTime > direct.hitTime &&
      landsOn(raised, solveBallisticLaunch(raised, up, 14)!, up) &&
      landsOn(raised, solveBallisticLaunch(raised, down, 14)!, down),
  );

  // 2. No gravity, and the unreachable.
  const sightline: IAutoMovieVector3 = { x: 5, y: 1, z: 5 };
  TestValidator.predicate(
    "the sightline",
    landsOn(
      raised,
      solveBallisticLaunch(raised, sightline, 10, NONE)!,
      sightline,
      NONE,
      PhysicalTolerance.CONVERGED,
    ),
  );
  TestValidator.equals(
    "unreachable",
    [
      solveBallisticLaunch(raised, raised, 10, NONE),
      solveBallisticLaunch(raised, sightline, 0, NONE),
      solveBallisticLaunch(raised, { x: 100, y: 1, z: 0 }, 8),
    ],
    [null, null, null],
  );

  // 3. Straight overhead.
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const overhead: IAutoMovieVector3 = { x: 0, y: 10, z: 0 };
  const above: number = Math.sqrt(400 - 2 * 9.81 * 10);
  const rising: Launch = solveBallisticLaunch(origin, overhead, 20)!;
  const falling: Launch = solveBallisticLaunch(
    origin,
    overhead,
    20,
    GRAVITY,
    "high",
  )!;
  TestValidator.predicate(
    "straight overhead",
    vclose(rising.velocity, { x: 0, y: 20, z: 0 }, PhysicalTolerance.ACCUMULATED) &&
      nclose(rising.hitTime, (20 - above) / 9.81, ROOT) &&
      vclose(falling.velocity, { x: 0, y: 20, z: 0 }, PhysicalTolerance.ACCUMULATED) &&
      nclose(falling.hitTime, (20 + above) / 9.81, ROOT) &&
      landsOn(origin, rising, overhead) &&
      landsOn(origin, falling, overhead),
  );
  TestValidator.equals(
    "beyond the apex",
    [
      solveBallisticLaunch(origin, { x: 0, y: 6, z: 0 }, 10, GRAVITY, "direct"),
      solveBallisticLaunch(origin, { x: 0, y: 6, z: 0 }, 10, GRAVITY, "high"),
    ],
    [null, null],
  );

  // 4. Straight below.
  const below: IAutoMovieVector3 = { x: 0, y: -20, z: 0 };
  const deep: number = Math.sqrt(400 + 2 * 9.81 * 20);
  const drop: Launch = solveBallisticLaunch(
    origin,
    below,
    20,
    GRAVITY,
    "direct",
  )!;
  const lob: Launch = solveBallisticLaunch(origin, below, 20, GRAVITY, "high")!;
  const pit: IAutoMovieVector3 = { x: 0, y: -4, z: 0 };
  const short: Launch = solveBallisticLaunch(origin, pit, 6)!;
  TestValidator.predicate(
    "straight below",
    vclose(drop.velocity, { x: 0, y: -20, z: 0 }, PhysicalTolerance.ACCUMULATED) &&
      nclose(drop.hitTime, (deep - 20) / 9.81, ROOT) &&
      vclose(lob.velocity, { x: 0, y: 20, z: 0 }, PhysicalTolerance.ACCUMULATED) &&
      nclose(lob.hitTime, (20 + deep) / 9.81, ROOT) &&
      landsOn(origin, drop, below) &&
      landsOn(origin, lob, below) &&
      vclose(short.velocity, { x: 0, y: -6, z: 0 }, PhysicalTolerance.ACCUMULATED) &&
      nclose(short.hitTime, (Math.sqrt(36 + 2 * 9.81 * 4) - 6) / 9.81, ROOT) &&
      landsOn(origin, short, pit),
  );
}
