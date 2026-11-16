import { ROM_TOLERANCE, hingedArmArticulation } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Deferred exact scoring may prune unnecessary objective work only when its
 * genuine lower bound proves the same complete ordering.
 *
 * Scenarios:
 * 1. A straight hinged chain's free X swivel has objective
 *    0.3(1-cos(s-100))+0.7(1-cos(s+20)). Its minimum is the angle of the
 *    weighted sum of those two unit directions, rather than the cheap term's
 *    100-degree minimum. The returned deviation includes both actual terms.
 * 2. Constant primary value1, cheap bound0 and an explicit primary tie leave
 *    the secondary objective1-cos(s-37) to choose37 degrees. The deferred
 *    primary value must still be1 and cannot be replaced by its zero bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the actual public score callback, valid nonnegative lower-bound construction, analytic periodic optima, degree units, declared refinement precision and two complete-order scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual hingedArmArticulation with deferred exact callbacks and optional second-key tie; reads the chosen swivel, complete deviation and secondary value, catching an uncomputed necessary objective or a bound reported as the true score.
 * @evidence contracts/development/testing.md#independent-expectations Adding weighted cosines gives1-R*cos(s-phi), where phi=atan2(sum weighted sines,sum weighted cosines) and R is that vector's length. Hence phi and1-R are independent exact optima. The secondary cosine has its unique circular minimum at37. Angular error uses existing ROM_TOLERANCE and objective error its derived R*(1-cos(tolerance)) bound, without another solver as oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a bound whose own minimizer differs from the full objective, deferred nonnegative terms, explicit primary ties and a genuinely necessary second key. Existing articulation entries own legality precedence, unreachable shells and certified branch exclusion.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable numerical unit owns analytic score callbacks on the existing isolated chain seam; it starts no Human producer, process, host or compiler and replaces no library operation or global.
 */
export function test_kinematics_hinged_score_lower_bound(): void {
  const radians: number = Math.PI / 180;
  const x: number = 0.3 * Math.cos(100 * radians) + 0.7 * Math.cos(-20 * radians);
  const y: number = 0.3 * Math.sin(100 * radians) + 0.7 * Math.sin(-20 * radians);
  const optimum: number = Math.atan2(y, x) / radians;
  const magnitude: number = Math.hypot(x, y);
  const solved: ReturnType<typeof hingedArmArticulation> = solve(
    (upper: IAutoMovieQuaternion): ReturnType<Parameters<typeof hingedArmArticulation>[0]["score"]> => {
      const angle: number = swivel(upper);
      const cheap: number = 0.3 * (1 - Math.cos((angle - 100) * radians));
      return { overshoot: 0, deviation: cheap,
        exact: (): number => cheap + 0.7 * (1 - Math.cos((angle + 20) * radians)) };
    },
  );
  TestValidator.predicate("deferred objective chooses the independent full periodic minimum",
    solved !== null && circular(solved.swivel - optimum) <= ROM_TOLERANCE,
  );
  if (solved !== null) {
    const actual: number = 0.3 * (1 - Math.cos((solved.swivel - 100) * radians)) +
      0.7 * (1 - Math.cos((solved.swivel + 20) * radians));
    TestValidator.predicate("selected deviation is the actual full score, not its cheap bound",
      nclose(solved.deviation, actual, 1e-12) &&
      nclose(solved.deviation, 1 - magnitude,
        magnitude * (1 - Math.cos(ROM_TOLERANCE * radians)) + 1e-12),
    );
  }
  const tied: ReturnType<typeof hingedArmArticulation> = solve(
    (upper: IAutoMovieQuaternion): ReturnType<Parameters<typeof hingedArmArticulation>[0]["score"]> => {
      const angle: number = swivel(upper);
      return { overshoot: 0, deviation: 0, exact: (): number => 1,
        tiebreak: (): number => 1 - Math.cos((angle - 37) * radians) };
    }, 0.1,
  );
  TestValidator.predicate("a necessary secondary objective keeps its full tied-primary meaning",
    tied !== null && circular(tied.swivel - 37) <= ROM_TOLERANCE &&
    nclose(tied.deviation, 1, 1e-12) && tied.second !== undefined &&
    nclose(tied.second, 0, 1 - Math.cos(ROM_TOLERANCE * radians) + 1e-12),
  );
}

/** Supply the same ordinary straight chain for either actual score contract. */
function solve(score: Parameters<typeof hingedArmArticulation>[0]["score"], tie?: number): ReturnType<typeof hingedArmArticulation> {
  return hingedArmArticulation({
    upper: { worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: { x: 0, y: 0, z: 0, w: 1 } },
    midOffset: { x: 0.3, y: 0, z: 0 }, midRest: { x: 0, y: 0, z: 0, w: 1 },
    endOffset: { x: 0.25, y: 0, z: 0 }, hinge: { x: 0, y: 0, z: 1 },
    target: { x: 0.55, y: 0, z: 0 }, score,
    ...(tie === undefined ? {} : { tie }),
  });
}

/** A straight plus-X chain's local rotation is its actual X swivel. */
function swivel(rotation: IAutoMovieQuaternion): number {
  return 2 * Math.atan2(rotation.x, rotation.w) * 180 / Math.PI;
}

/** Distance on the degree circle without changing the engine's refinement law. */
function circular(degrees: number): number {
  return Math.abs(degrees - 360 * Math.round(degrees / 360));
}
