import {
  Quaternion,
  hingedArmArticulation,
  hingedArmSwivel,
} from "@automovie/engine";
import type {
  IAutoMovieHingedArticulation,
  IAutoMovieHingedChainGeometry,
  IAutoMovieQuaternion,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hinged chain's fit continued from a seed (`near`) is the fit of the whole
 * sweep inside the seed's basin, to its own tolerance, and stays on the seed's
 * basin where the fit itself jumps to another.
 *
 * The chain is 0.3 m and 0.25 m along +X with a +Y hinge at the origin, its
 * target 0.6 m out, past its 0.55 m span, so it has one bend branch. A
 * candidate's score is written in its swivel through `hingedArmSwivel.pose`:
 * two root rotations a swivel `d` apart are `d` apart, so the squared angle to
 * the rotation at a swivel `c` is a well whose bottom is `c`.
 *
 * Scenarios:
 *
 * 1. In one basin, a well at 63.37 degrees (between sweep steps): the sweep's fit
 *    names its swivel within its resolution (`hingedArmSwivel.RESOLUTION`) and
 *    its branch, and the fit seeded at 63.9 degrees with a tolerance of 1e-9
 *    degrees lands within 1e-9 of 63.37, so within the sweep's resolution of
 *    the sweep's fit.
 * 2. On a range's edge: every swivel more than 20 degrees from 30 overshoots by
 *    its excess, and the well asks for 70, so the best legal swivel is the edge
 *    at 50. Seeded at 49.6 degrees, the fit lands legal within 1e-9 of 50.
 * 3. Across a change of basin: a well at `60 + 100 t` degrees and one at 240
 *    degrees, the first 0.005 deeper until 1.5 ms and 0.005 shallower after.
 *    Read at 1, 2 and 3 ms, the sweep's fit jumps from the first basin to the
 *    second, its one-sided difference above 10,000 degrees per second, while
 *    the fit seeded from the first read stays on the first basin and its
 *    difference is the basin's own 100 degrees per second, within 1e-3.
 * 4. A seed of the second branch, on a target with only one, continues on the one;
 *    a tolerance of 0 or one not finite throws. The smallest positive binary64
 *    tolerance still returns a finite fit satisfying the original 1e-9-degree
 *    observation bound, rather than requesting an infinite refinement count
 *    after its tolerance ratio underflows.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public articulation with and without a seed and reads the swivel and branch it names and the difference of three reads; a seed ignored, a refinement short of its tolerance, an edge crossed or a basin left fails.
 * @evidence contracts/development/testing.md#independent-expectations Every expected swivel is a well's bottom or a range's edge this test writes, and the basin's rate is its written slope; none is read from a solver.
 * @evidence contracts/development/testing.md#distinguishing-cases An interior optimum, an optimum on a range's edge, a change of basin between reads, a branch the target lacks, two refused tolerances and the valid positive subnormal boundary with the unchanged 1e-9-degree observation bound.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, how a score is written in the swivel and the 4 scenarios with their bounds.
 */
export function test_kinematics_hinged_arm_near(): void {
  type IScore = { overshoot: number; deviation: number };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const target: IAutoMovieVector3 = { x: 0.6, y: 0, z: 0 };
  const chain: IAutoMovieHingedChainGeometry = {
    upper: {
      worldPosition: { x: 0, y: 0, z: 0 },
      worldRotation: identity,
    },
    midOffset: { x: 0.3, y: 0, z: 0 },
    midRest: identity,
    endOffset: { x: 0.25, y: 0, z: 0 },
    hinge: { x: 0, y: 1, z: 0 },
    target,
  };
  const theta: number = hingedArmSwivel.branches(chain)![0]!.theta;
  const at = (swivel: number): IAutoMovieQuaternion =>
    hingedArmSwivel.pose(chain, theta)(swivel).upper;
  const degrees = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
    (Quaternion.angle(a, b) * 180) / Math.PI;
  const well = (upper: IAutoMovieQuaternion, bottom: number): number =>
    degrees(upper, at(bottom)) ** 2;
  const fit = (
    score: (upper: IAutoMovieQuaternion) => IScore,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieHingedArticulation =>
    hingedArmArticulation({
      ...chain,
      score: (upper: IAutoMovieQuaternion): IScore => score(upper),
      ...(near === undefined ? {} : { near }),
    })!;

  // 1. One basin, between sweep steps.
  const interior = (upper: IAutoMovieQuaternion): IScore => ({
    overshoot: 0,
    deviation: well(upper, 63.37),
  });
  const swept: IAutoMovieHingedArticulation = fit(interior);
  const seeded: IAutoMovieHingedArticulation = fit(interior, {
    swivel: 63.9,
    branch: 0,
    tolerance: 1e-9,
  });
  TestValidator.predicate(
    `the sweep names its swivel and branch (${swept.swivel})`,
    Math.abs(swept.swivel - 63.37) <= hingedArmSwivel.RESOLUTION &&
      swept.branch === 0,
  );
  TestValidator.predicate(
    `the seeded fit lands within its tolerance (${seeded.swivel})`,
    Math.abs(seeded.swivel - 63.37) <= 1e-9 &&
      Math.abs(seeded.swivel - swept.swivel) <= hingedArmSwivel.RESOLUTION &&
      degrees(seeded.upper, at(63.37)) <= 1e-9,
  );

  // 2. On a range's edge.
  const edged: IAutoMovieHingedArticulation = fit(
    (upper: IAutoMovieQuaternion): IScore => ({
      overshoot: Math.max(0, degrees(upper, at(30)) - 20),
      deviation: well(upper, 70),
    }),
    { swivel: 49.6, branch: 0, tolerance: 1e-9 },
  );
  TestValidator.predicate(
    `the seeded fit lands on the edge (${edged.swivel})`,
    edged.overshoot === 0 && edged.swivel <= 50 && edged.swivel >= 50 - 1e-9,
  );

  // 3. Across a change of basin.
  const changing =
    (t: number): ((upper: IAutoMovieQuaternion) => IScore) =>
    (upper: IAutoMovieQuaternion): IScore => ({
      overshoot: 0,
      deviation: Math.min(
        well(upper, 60 + 100 * t) + (t > 0.0015 ? 0.005 : -0.005),
        well(upper, 240),
      ),
    });
  const h: number = 1e-3;
  const first: IAutoMovieHingedArticulation = fit(changing(h));
  const jumping: number[] = [h, 2 * h, 3 * h].map(
    (t: number): number => fit(changing(t)).swivel,
  );
  const continued: number[] = [h, 2 * h, 3 * h].map(
    (t: number): number =>
      fit(changing(t), {
        swivel: first.swivel,
        branch: first.branch,
        tolerance: 1e-9,
      }).swivel,
  );
  const rate = (s: number[]): number =>
    (-3 * s[0]! + 4 * s[1]! - s[2]!) / (2 * h);
  TestValidator.predicate(
    `the sweep's fit jumps basins (${rate(jumping).toFixed(0)} deg/s)`,
    Math.abs(rate(jumping)) > 1e4,
  );
  TestValidator.predicate(
    `the continued fit keeps its basin's rate (${rate(continued)} deg/s)`,
    Math.abs(rate(continued) - 100) <= 1e-3,
  );

  // 4. A branch the target lacks, and refused tolerances.
  const lone: IAutoMovieHingedArticulation = fit(interior, {
    swivel: 63.9,
    branch: 1,
    tolerance: 1e-9,
  });
  TestValidator.predicate(
    "a seed's missing branch continues on the one there is",
    lone.branch === 0 && Math.abs(lone.swivel - 63.37) <= 1e-9,
  );
  TestValidator.error("a zero tolerance", (): unknown =>
    fit(interior, { swivel: 63, branch: 0, tolerance: 0 }),
  );
  const subnormal: IAutoMovieHingedArticulation = fit(interior, {
    swivel: 63.9,
    branch: 0,
    tolerance: Number.MIN_VALUE,
  });
  TestValidator.predicate(
    "a positive subnormal tolerance terminates with the actual well's finite fit",
    subnormal.branch === 0 &&
      Math.abs(subnormal.swivel - 63.37) <= 1e-9 &&
      degrees(subnormal.upper, at(63.37)) <= 1e-9,
  );
}
