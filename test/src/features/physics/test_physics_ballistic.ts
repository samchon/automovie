import { projectileAt, solveBallisticLaunch } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

const GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

/** Where the projectile is at the solution's hit time. */
const landing: (
  origin: IAutoMovieVector3,
  sol: NonNullable<ReturnType<typeof solveBallisticLaunch>>,
  gravity?: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  origin: IAutoMovieVector3,
  sol: NonNullable<ReturnType<typeof solveBallisticLaunch>>,
  gravity: IAutoMovieVector3 = GRAVITY,
): IAutoMovieVector3 =>
  projectileAt({ origin, velocity: sol.velocity, gravity }, sol.hitTime)
    .position;

/**
 * Observe fixed-speed ballistic launch solutions by evaluating their returned velocity/hit time through the constant-acceleration forward equation. Literal targets constrain inverse-solve residuals, while null checks preserve unsupported coincident, speed and range cases.
 *
 * Scenarios:
 *
 * 1. A level target lands under the direct solve, and its launch speed matches 14 with the original strict 1e-6 residual bound.
 * 2. A high arc reaches the same target and has greater hit time than the direct arc.
 * 3. A raised and a lowered target both land (positive and negative height).
 * 4. Zero gravity lands on the target; coincident origin and zero speed return null.
 * 5. Purely vertical targets above and below land; a vertical target too high for the speed returns null.
 * 6. A horizontal target beyond the supplied speed's range returns null.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls solveBallisticLaunch for each original geometry and feeds successful velocity/time pairs into projectileAt, checking landing residuals, one speed residual, direct/high flight ordering and null refusals. A wrong inverse angle or flight time generally misses the hand-authored target.
 * @evidence contracts/testing.md#independent-expectations World target literals and requested speed define expectations independently of the inverse solver; landing uses original vclose component tolerances 1e-3 and zero-gravity 1e-6. The scalar speed uses nclose together with the original strict less-than 1e-6 bound, preserving its boundary strength. projectileAt shares production vector arithmetic, so this is forward/inverse consistency rather than an independent implementation of all physics; high-arc steepness and velocity parallelism are not separately asserted.
 * @evidence contracts/testing.md#distinguishing-cases Preserves level direct/high, raised/lowered, zero gravity with coincident/zero-speed refusal, vertical up/down/too-high and horizontal out-of-range cases and every original coordinate/speed/order. Tilted gravity, nonfinite admission, maximum-range discriminant boundaries and moving interception are outside this unit.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns every solve and forward evaluation through a local landing callback. Successful-path non-null assertions reach a failure if no solution exists; fixtures register nothing and no renderer, native artifact or process is started.
 */
export function test_physics_ballistic(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  const level: IAutoMovieVector3 = { x: 8, y: 1, z: 3 };
  const direct: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, level, 14)!;
  TestValidator.predicate(
    "direct arc lands on the level target",
    vclose(landing(origin, direct), level, 1e-3),
  );
  const launchSpeed: number = Math.hypot(
    direct.velocity.x,
    direct.velocity.y,
    direct.velocity.z,
  );
  TestValidator.predicate(
    "launch speed matches the request",
    nclose(launchSpeed, 14, 1e-6) && Math.abs(launchSpeed - 14) < 1e-6,
  );

  const high: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, level, 14, GRAVITY, "high")!;
  TestValidator.predicate(
    "high arc lands on the same target",
    vclose(landing(origin, high), level, 1e-3),
  );
  TestValidator.predicate(
    "the high arc flies longer than the direct arc",
    high.hitTime > direct.hitTime,
  );

  const up: IAutoMovieVector3 = { x: 6, y: 4.5, z: -2 };
  const down: IAutoMovieVector3 = { x: 6, y: -1.5, z: -2 };
  TestValidator.predicate(
    "a raised target lands",
    vclose(landing(origin, solveBallisticLaunch(origin, up, 14)!), up, 1e-3),
  );
  TestValidator.predicate(
    "a lowered target lands",
    vclose(
      landing(origin, solveBallisticLaunch(origin, down, 14)!),
      down,
      1e-3,
    ),
  );

  const straight: IAutoMovieVector3 = { x: 5, y: 1, z: 5 };
  const noG: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, straight, 10, { x: 0, y: 0, z: 0 })!;
  TestValidator.predicate(
    "zero gravity is a straight shot on target",
    vclose(landing(origin, noG, { x: 0, y: 0, z: 0 }), straight, 1e-6),
  );
  TestValidator.equals(
    "zero gravity, target on the origin → null",
    solveBallisticLaunch(origin, origin, 10, { x: 0, y: 0, z: 0 }),
    null,
  );
  TestValidator.equals(
    "zero gravity, zero speed → null",
    solveBallisticLaunch(origin, straight, 0, { x: 0, y: 0, z: 0 }),
    null,
  );

  const overhead: IAutoMovieVector3 = { x: 0, y: 6, z: 0 };
  const vertical: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, overhead, 12)!;
  TestValidator.predicate(
    "a purely vertical target lands",
    vclose(landing(origin, vertical), overhead, 1e-3),
  );
  const belowPit: IAutoMovieVector3 = { x: 0, y: -4, z: 0 };
  TestValidator.predicate(
    "a vertical target straight down lands",
    vclose(
      landing(origin, solveBallisticLaunch(origin, belowPit, 6)!),
      belowPit,
      1e-3,
    ),
  );
  TestValidator.equals(
    "a vertical target too high for the speed → null",
    solveBallisticLaunch(origin, { x: 0, y: 50, z: 0 }, 5),
    null,
  );

  TestValidator.equals(
    "a target out of range → null",
    solveBallisticLaunch(origin, { x: 100, y: 1, z: 0 }, 8),
    null,
  );
}
