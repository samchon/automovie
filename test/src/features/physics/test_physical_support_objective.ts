import {
  type AutoMovieXpbdBody,
  type AutoMovieXpbdWorld,
  solveXpbdArticulationContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The support cascade solves IHMC's weighted whole-body objective
 * (`AutoMovieXpbdWorld.IObjective`) as IHMC builds it:
 *
 * 1. Rows: a normal row's unit impulse at (0.1, 0, 0.2) gives the force (0, 1, 0),
 *    no yaw moment about a centre of mass above the origin, and the moment
 *    about a desired centre of pressure at the origin, (-0.2, 0.1) in x and z,
 *    `x_cop J_fz + J_ty` and `y_cop J_fz - J_tx` up to sign
 *    (`CoPObjectiveCalculator.computeTask`); a tangential row there gives a yaw
 *    moment of 0.2 and no centre of pressure moment; a row on a body the
 *    command does not name gives none (`WrenchMatrixCalculator` l.269-281).
 * 2. Weights: two normal rows at x = -0.1 and 0.1 asked for 10 N s up with the
 *    centre of pressure at x = 0.05 share it 2.5 and 7.5, the moment about the
 *    point zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's expected value and the shared impulse.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `objectiveRow` and `solveXpbdSupportCascade` and reads their outputs.
 * @evidence contracts/development/testing.md#independent-expectations The rows are cross products worked by hand; the split solves n1 + n2 = 10 and -0.15 n1 + 0.05 n2 = 0.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a normal row from a tangential one, a counted body from another, and a weighted centre of pressure from the unweighted wrench rows, which would split the impulse evenly.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or simulation run.
 */
export function test_physical_support_objective(): void {
  const failures: string[] = [];
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  const counted = {} as AutoMovieXpbdBody;
  const other = {} as AutoMovieXpbdBody;
  const objective: AutoMovieXpbdWorld.IObjective = {
    force: { x: 0.5, y: 0.02, z: 0.5 },
    yaw: { center: { x: 0, y: 1, z: 0 }, weight: 0.1 },
    pressure: {
      point: { x: 0, y: 0, z: 0 },
      weight: 15,
      bodies: [counted],
    },
  };
  const row = (
    direction: { x: number; y: number; z: number },
    x: number,
  ): solveXpbdArticulationContacts.IRow =>
    ({
      state: 0,
      point: { x, y: 0, z: 0.2 },
      direction,
      velocity: 0,
    }) as unknown as solveXpbdArticulationContacts.IRow;

  // 1. The rows.
  const normal: number[] = solveXpbdArticulationContacts.objectiveRow(
    row({ x: 0, y: 1, z: 0 }, 0.1),
    { x: 0.1, y: 0, z: 0.2 },
    counted,
    objective,
  );
  const expected: number[] = [0, 1, 0, 0, -0.2, 0.1];
  if (
    !normal.every((value: number, i: number): boolean =>
      near(value, expected[i]!),
    )
  )
    failures.push(`normal row ${JSON.stringify(normal)}`);
  const tangent: number[] = solveXpbdArticulationContacts.objectiveRow(
    row({ x: 1, y: 0, z: 0 }, 0.1),
    { x: 0.1, y: 0, z: 0.2 },
    counted,
    objective,
  );
  const sideways: number[] = [1, 0, 0, 0.2, 0, 0];
  if (
    !tangent.every((value: number, i: number): boolean =>
      near(value, sideways[i]!),
    )
  )
    failures.push(`tangential row ${JSON.stringify(tangent)}`);
  const elsewhere: number[] = solveXpbdArticulationContacts.objectiveRow(
    row({ x: 0, y: 1, z: 0 }, 0.1),
    { x: 0.1, y: 0, z: 0.2 },
    other,
    objective,
  );
  if (!near(elsewhere[4]!, 0) || !near(elsewhere[5]!, 0))
    failures.push(`a row on another body counts: ${JSON.stringify(elsewhere)}`);

  // 2. The weighted split.
  const plain: AutoMovieXpbdWorld.IObjective = {
    force: { x: 0.5, y: 0.02, z: 0.5 },
    pressure: { point: { x: 0.05, y: 0, z: 0 }, weight: 15 },
  };
  const columns: number[][] = [-0.1, 0.1].map((x: number): number[] =>
    solveXpbdArticulationContacts.objectiveRow(
      row({ x: 0, y: 1, z: 0 }, x),
      { x, y: 0, z: 0 },
      counted,
      plain,
    ),
  );
  const x: number[] | null = solveXpbdSupportCascade({
    k: [
      [1, 0],
      [0, 1],
    ],
    u: [0, 0],
    columns,
    target: [0, 10, 0, 0, 0],
    weights: [0.5, 0.02, 0.5, 15, 15],
    set: {
      rows: [row({ x: 0, y: 1, z: 0 }, -0.1), row({ x: 0, y: 1, z: 0 }, 0.1)],
      patches: [],
    },
    actuators: [],
    motion: [],
    warm: { first: [], second: [] },
  });
  // The unknowns' sqrt(eps) regularization weighs against the vertical
  // row's 0.02, so the split is met to a few micro newton seconds.
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-4;
  if (x === null || !close(x[0]!, 2.5) || !close(x[1]!, 7.5))
    failures.push(
      `the weighted split is ${JSON.stringify(x)}, not 2.5 and 7.5`,
    );
  TestValidator.equals("support objective", failures, []);
}
