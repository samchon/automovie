import { ROM_TOLERANCE, hingedArmArticulation } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
 * 3. A constant positive ROM overshoot1 makes a legal result impossible.
 *    Certifying the70..130-degree interval as excluded cannot prevent the
 *    required full fallback from finding the same analytic periodic minimum
 *    as the unpruned solve, with its actual positive overshoot unchanged.
 * 4. A certified zero minimum preserves the first0-degree solution when
 *    its actual exact score is zero. With the same zero cheap bound but
 *    an actual minimum at50 degrees, the search must continue. An explicit
 *    secondary tie still selects37 even with a valid primary certificate.
 */
export function test_unit_engine_kinematics_hinged_score_lower_bound(): void {
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
    }, 0.1, undefined, { overshoot: 0, deviation: 1 },
  );
  TestValidator.predicate("a necessary secondary objective keeps its full tied-primary meaning",
    tied !== null && circular(tied.swivel - 37) <= ROM_TOLERANCE &&
    nclose(tied.deviation, 1, 1e-12) && tied.second !== undefined &&
    nclose(tied.second, 0, 1 - Math.cos(ROM_TOLERANCE * radians) + 1e-12),
  );
  for (const pruning of [false, true]) {
    const positive: ReturnType<typeof hingedArmArticulation> = solve(
      (upper: IAutoMovieQuaternion): ReturnType<Parameters<typeof hingedArmArticulation>[0]["score"]> => {
        const angle: number = swivel(upper);
        const cheap: number = 0.3 * (1 - Math.cos((angle - 100) * radians));
        return { overshoot: 1, deviation: cheap,
          exact: (): number => cheap + 0.7 * (1 - Math.cos((angle + 20) * radians)) };
      }, undefined, pruning ? (): ((low: number, high: number) => boolean) =>
        (low: number, high: number): boolean => low >= 70 && high <= 130 : undefined,
    );
    TestValidator.predicate("certified positive regions retain the original full-fallback optimum",
      positive !== null && nclose(positive.overshoot, 1, 0) &&
      circular(positive.swivel - optimum) <= ROM_TOLERANCE &&
      nclose(positive.deviation, 1 - magnitude,
        magnitude * (1 - Math.cos(ROM_TOLERANCE * radians)) + 1e-12),
    );
  }
  for (const target of [0, 50]) {
    const minimum: ReturnType<typeof hingedArmArticulation> = solve(
      (upper: IAutoMovieQuaternion): ReturnType<Parameters<typeof hingedArmArticulation>[0]["score"]> => {
        const angle: number = swivel(upper);
        return { overshoot: 0, deviation: 0,
          exact: (): number => 1 - Math.cos((angle - target) * radians) };
      }, undefined, undefined, { overshoot: 0, deviation: 0 },
    );
    TestValidator.predicate("a certified minimum requires the first candidate's actual exact score",
      minimum !== null && circular(minimum.swivel - target) <= ROM_TOLERANCE &&
      nclose(minimum.deviation, 0, 1 - Math.cos(ROM_TOLERANCE * radians) + 1e-12) &&
      (target !== 0 || minimum.swivel === 0),
    );
  }
}

/** Supply the same ordinary straight chain for either actual score contract. */
function solve(score: Parameters<typeof hingedArmArticulation>[0]["score"], tie?: number,
  excluded?: Parameters<typeof hingedArmArticulation>[0]["excluded"],
  minimum?: Parameters<typeof hingedArmArticulation>[0]["minimum"]): ReturnType<typeof hingedArmArticulation> {
  return hingedArmArticulation({
    upper: { worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: { x: 0, y: 0, z: 0, w: 1 } },
    midOffset: { x: 0.3, y: 0, z: 0 }, midRest: { x: 0, y: 0, z: 0, w: 1 },
    endOffset: { x: 0.25, y: 0, z: 0 }, hinge: { x: 0, y: 0, z: 1 },
    target: { x: 0.55, y: 0, z: 0 }, score,
    ...(tie === undefined ? {} : { tie }),
    ...(excluded === undefined ? {} : { excluded }),
    ...(minimum === undefined ? {} : { minimum }),
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
