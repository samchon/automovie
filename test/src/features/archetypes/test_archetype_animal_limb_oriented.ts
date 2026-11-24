import { AutoMovieArchetypeQuadrupedLimb } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * An actual terminal-axis goal constrains the full four-bar geometry.
 *
 * Scenarios:
 *
 * 1. Literal lengths 2,3,4,5 with a downward terminal axis retain that axis and
 *    exact root/foot endpoints for both bend branches and off-axis goals.
 * 2. The root-to-ankle bands are [5,9] unfolded, [3,7] after a quarter-turn and
 *    [1,3] after a half-turn. Terminal translation is exactly five metres
 *    upward from a downward-oriented foot endpoint, not a fitted body offset.
 * 3. Exact tangencies succeed; adjacent outside ankle targets, zero distance,
 *    invalid axes/planes and nonfinite data refuse instead of moving a root or
 *    changing the actual four lengths or requested terminal orientation.
 * 4. Axis input and returned target/range/point mutations cannot rewrite the
 *    prepared oriented solver or the caller's exact root and foot records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines independent metre lengths, degree fold, normalized actual terminal direction, ankle-versus-foot semantics, strict boundary refusals and snapshot ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises actual prepare/oriented/range/target/solve and inspects all five returned points, four Euclidean lengths, fixed terminal direction and signed carpus fold. A solver that satisfies only the foot point while rotating its solid sole incorrectly cannot pass.
 * @evidence contracts/development/testing.md#independent-expectations The last length is five, so a downward terminal gives ankle=foot+(0,5,0). Remaining lower lengths three and four sum to seven, are a 3-4-5 triangle at ninety degrees and differ by one at 180 degrees; triangle inequality with upper two gives the three literal bands. Observed coordinates use 1e-10 m precision and raw two-ULP outside distances remain refused.
 * @evidence contracts/development/testing.md#distinguishing-cases Both bend signs, nonunit input axis, off-axis endpoint, all fold modes, inner/outer tangencies, near outside, invalid/zero direction and prepared replay distinguish endpoint-only IK from the complete rigid effector. Point-only triangle and whole-body root intersection have separate independent units.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous portable unit owns literal controls and inputs and calls the real exported geometric seam, without a process, compiler, renderer, wall-clock assertion or foreign-method replacement.
 */
export function test_archetype_animal_limb_oriented(): void {
  const findings: string[] = [];
  const source: readonly IAutoMovieVector3[] = [
    { x: 2, y: 0, z: 0 },
    { x: 2, y: -2, z: 0 },
    { x: 2, y: -5, z: 0 },
    { x: 2, y: -9, z: 0 },
    { x: 2, y: -14, z: 0 },
  ];
  const original: string = JSON.stringify(source);
  for (const fore of [true, false]) {
    const prepared: AutoMovieArchetypeQuadrupedLimb.IPrepared =
      AutoMovieArchetypeQuadrupedLimb.prepare(source, fore);
    const direction: IAutoMovieVector3 = { x: 0, y: -3, z: 0 };
    const oriented: ReturnType<
      AutoMovieArchetypeQuadrupedLimb.IPrepared["oriented"]
    > = prepared.oriented(direction);
    for (const [fold, minimum, maximum] of [
      [0, 5, 9],
      [90, 3, 7],
      [180, 1, 3],
    ] as const) {
      const range: AutoMovieArchetypeQuadrupedLimb.IRange =
        oriented.range(fold);
      near(`${fore}/${fold} independent ankle minimum`, range.minimum, minimum);
      near(`${fore}/${fold} independent ankle maximum`, range.maximum, maximum);
    }
    const root: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
    for (const [goal, fold] of [
      [{ x: 2, y: -14, z: 0 }, 0],
      [{ x: 2, y: -10, z: 0 }, 0],
      [{ x: 2, y: -10, z: 4 }, 0],
      [{ x: 2, y: -10, z: 4 }, 90],
      [{ x: 2, y: -7, z: 0 }, 180],
    ] as const) {
      const target: IAutoMovieVector3 = oriented.target(goal);
      near(`${fore}/${fold} ankle X`, target.x, goal.x, 0);
      near(`${fore}/${fold} ankle Y`, target.y, goal.y + 5, 0);
      near(`${fore}/${fold} ankle Z`, target.z, goal.z, 0);
      const points: IAutoMovieVector3[] = oriented.solve(root, goal, fold);
      verify(points, root, goal, `${fore}/${fold}/${goal.z}`);
      if (fold === 90) {
        const b: IAutoMovieVector3 = difference(points[2]!, points[1]!);
        const c: IAutoMovieVector3 = difference(points[3]!, points[2]!);
        near(
          `${fore} actual quarter-fold dot`,
          b.x * c.x + b.y * c.y + b.z * c.z,
          0,
        );
        truth(
          `${fore} actual quarter-fold sign`,
          fore ? b.y * c.z - b.z * c.y > 0 : b.y * c.z - b.z * c.y < 0,
        );
      }
    }
    for (const [label, goal, fold] of [
      ["just beyond outer ankle", { x: 2, y: -(14 + 2 ** -48), z: 0 }, 0],
      ["just inside ankle hole", { x: 2, y: -(10 - 2 ** -48), z: 0 }, 0],
      ["overdrop", { x: 2, y: -15, z: 0 }, 0],
      ["quarter fold loses reach", { x: 2, y: -13, z: 0 }, 90],
      ["zero ankle distance", { x: 2, y: -5, z: 0 }, 0],
      ["wrong endpoint plane", { x: 2.01, y: -12, z: 0 }, 0],
      ["nonfinite endpoint", { x: 2, y: -12, z: NaN }, 0],
    ] as const)
      refusal(`${fore}/${label}`, (): unknown =>
        oriented.solve(root, goal, fold),
      );
    for (const axis of [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: -1, z: 0 },
      { x: NaN, y: -1, z: 0 },
      { x: 0, y: -Infinity, z: 0 },
    ])
      refusal(`${fore}/invalid actual terminal axis`, (): unknown =>
        prepared.oriented(axis),
      );
    refusal(`${fore}/invalid target`, (): unknown =>
      oriented.target({ x: 2, y: Infinity, z: 0 }),
    );

    direction.y = 100;
    const foot: IAutoMovieVector3 = { x: 2, y: -12, z: 1 };
    const target: IAutoMovieVector3 = oriented.target(foot);
    target.y += 100;
    const range: AutoMovieArchetypeQuadrupedLimb.IRange = oriented.range(0);
    range.maximum = 100;
    const output: IAutoMovieVector3[] = oriented.solve(root, foot, 0);
    output[0]!.y += 100;
    output[4]!.z += 100;
    near(`${fore} caller root remains independent`, root.y, 0, 0);
    near(`${fore} caller foot remains independent`, foot.z, 1, 0);
    near(
      `${fore} axis/target mutation preserves snapshot`,
      oriented.target(foot).y,
      -7,
      0,
    );
    near(
      `${fore} returned range mutation preserves snapshot`,
      oriented.range(0).maximum,
      9,
    );
    verify(
      oriented.solve(root, foot, 0),
      root,
      foot,
      `${fore}/oriented replay`,
    );
  }
  truth(
    "oriented preparation and calls preserve actual source",
    JSON.stringify(source) === original,
  );
  TestValidator.equals(
    "fixed actual terminal-axis four-bar geometry",
    findings,
    [],
  );

  /** The actual returned terminal vector must be down five independently of IK. */
  function verify(
    points: readonly IAutoMovieVector3[],
    root: IAutoMovieVector3,
    foot: IAutoMovieVector3,
    label: string,
  ): void {
    truth(`${label} five actual points`, points.length === 5);
    for (const axis of ["x", "y", "z"] as const) {
      near(`${label} exact root.${axis}`, points[0]![axis], root[axis], 0);
      near(`${label} exact foot.${axis}`, points[4]![axis], foot[axis], 0);
    }
    for (const [index, length] of [
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ] as const) {
      const actual: IAutoMovieVector3 = difference(
        points[index + 1]!,
        points[index]!,
      );
      near(
        `${label} actual length ${index}`,
        Math.hypot(actual.x, actual.y, actual.z),
        length,
      );
    }
    const actual: IAutoMovieVector3 = difference(points[4]!, points[3]!);
    near(`${label} terminal direction X`, actual.x, 0);
    near(`${label} terminal direction Y`, actual.y, -5);
    near(`${label} terminal direction Z`, actual.z, 0);
  }

  /**
   * Raw coordinate differences measure the real solved bars, not their declared
   * ranges.
   */
  function difference(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  /**
   * An invalid actual geometric request must produce the declared refusal
   * class.
   */
  function refusal(label: string, action: () => unknown): void {
    let error: unknown;
    try {
      action();
    } catch (caught) {
      error = caught;
    }
    truth(label, error instanceof RangeError);
  }

  /** Numerical observation uses the existing finite scalar predicate. */
  function near(
    label: string,
    actual: number,
    expected: number,
    precision: number = 1e-10,
  ): void {
    truth(
      `${label}: ${actual}, expected ${expected}`,
      nclose(actual, expected, precision),
    );
  }

  /** Collect independent decisions in one cause batch. */
  function truth(label: string, condition: boolean): void {
    try {
      TestValidator.predicate(label, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
