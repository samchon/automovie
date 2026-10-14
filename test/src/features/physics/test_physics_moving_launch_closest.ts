import { solveMovingLaunch } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };
const GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

/**
 * A target accelerating away (`x = 20 + 5t²`) makes the flight-time residual
 * `|hitTime - guess|` fall to a minimum and then rise again. When the loop is capped
 * before it diverges, the solver must return the **closest** iterate it visited
 * (the one the JSDoc promises), not merely the last guess, which is farther
 * from a fixed point.
 *
 * Scenarios:
 *
 * 1. Four candidate times from the specified distance/speed seed have a minimum residual before the final candidate.
 * 2. A four-iteration cap returns that closest candidate rather than the final candidate.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves the accelerating target with four iterations and compares its time with independently computed candidate flights, catching last-iterate selection when the earlier residual is smaller.
 * @evidence contracts/testing.md#independent-expectations Eliminating launch velocity gives a quadratic in squared flight time; its lower positive root supplies each candidate without calling solveBallisticLaunch or copying its angle solve. The declared iteration seed/update contract still determines which candidates are visited; this does not prove global interception.
 * @evidence contracts/testing.md#distinguishing-cases Requires a non-monotone residual, a closest candidate distinct from the last and both equality to closest and inequality to last; settled and invalid-cap behavior belong to neighboring moving-launch units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns its analytic candidate arithmetic and direct solver assertions, without hosts, fixtures generated on disk or dynamically registered cases.
 */
export function test_physics_moving_launch_closest(): void {
  const speed: number = 20;
  const accel: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => ({
    x: 20 + 5 * t * t,
    y: 1,
    z: 0,
  });

  // |delta/t - gravity*t/2|^2 = speed^2 is quadratic in t^2.
  // Use its rationalized lower root, independently of the engine's angle solve.
  const init: IAutoMovieVector3 = accel(0);
  let guess: number =
    Math.hypot(init.x - origin.x, init.y - origin.y, init.z - origin.z) / speed;
  const iterates: Array<{ hitTime: number; residual: number }> = [];
  for (let i: number = 0; i < 4; ++i) {
    const target: IAutoMovieVector3 = accel(guess);
    const distanceSquared: number =
      (target.x - origin.x) ** 2 +
      (target.y - origin.y) ** 2 +
      (target.z - origin.z) ** 2;
    const linear: number = speed ** 2 - 9.81 * (target.y - origin.y);
    const hitTime: number = Math.sqrt(
      (2 * distanceSquared) /
        (linear + Math.sqrt(linear ** 2 - 9.81 ** 2 * distanceSquared)),
    );
    iterates.push({
      hitTime,
      residual: Math.abs(hitTime - guess),
    });
    guess = hitTime;
  }

  const closest: (typeof iterates)[number] = iterates.reduce(
    (
      a: (typeof iterates)[number],
      b: (typeof iterates)[number],
    ): (typeof iterates)[number] => (b.residual < a.residual ? b : a),
  );
  const last: (typeof iterates)[number] = iterates[iterates.length - 1]!;
  TestValidator.predicate(
    "the residual is non-monotone, the fixed point does not settle within four",
    closest !== last && last.residual > closest.residual,
  );

  // Capped at four iterates the moving-launch solve must be the closest iterate
  // (iterate 2, hitTime ~1.7355), NOT the last one visited (iterate 3, ~1.9894).
  const led: ReturnType<typeof solveMovingLaunch> = solveMovingLaunch(
    origin,
    accel,
    speed,
    GRAVITY,
    "direct",
    4,
  );
  TestValidator.predicate(
    "the capped moving launch returns the closest iterate, not the last",
    led !== null &&
      nclose(led.hitTime, closest.hitTime, 1e-9) &&
      !nclose(led.hitTime, last.hitTime, 1e-6),
  );
}
