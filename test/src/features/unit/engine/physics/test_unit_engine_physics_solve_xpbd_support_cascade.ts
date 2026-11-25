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
 * 2. The realized split: normal rows asked for 10 N s up with the centre of
 *    pressure at a point carry it whole with their centre of pressure there,
 *    each foot's share the least split of that moment balance: two feet at x =
 *    -0.1 and 0.1 with the point at x = 0.05 share 2.5 and 7.5, and with it on
 *    the edge x = 0.1, 0 and 10; four feet at (+-0.1, +-0.2) with the point at
 *    (0.05, 0.05) share 4.375, 3.125, 1.875 and 0.625, and with it on the edge
 *    x = 0.1, 5, 5, 0 and 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's expected value and the shared impulse.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `objectiveRow` and `solveXpbdSupportCascade` and reads their outputs.
 * @evidence contracts/development/testing.md#independent-expectations The rows are cross products worked by hand; each split is the least-norm solution of sum n = 10 and sum n p = 10 cop, worked by hand over the feet's centred coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a normal row from a tangential one, a counted body from another, a weighted centre of pressure from the unweighted wrench rows, which would split the impulse evenly, two feet from four, and a point inside the support from one on its edge, where a foot carries nothing.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or simulation run.
 */
export function test_unit_engine_physics_solve_xpbd_support_cascade(): void {
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
  const row = (direction: {
    x: number;
    y: number;
    z: number;
  }): Pick<solveXpbdArticulationContacts.IRow, "direction"> => ({
    direction,
  });

  // 1. The rows.
  const normal: number[] = solveXpbdArticulationContacts.objectiveRow(
    row({ x: 0, y: 1, z: 0 }),
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
    row({ x: 1, y: 0, z: 0 }),
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
    row({ x: 0, y: 1, z: 0 }),
    { x: 0.1, y: 0, z: 0.2 },
    other,
    objective,
  );
  if (!near(elsewhere[4]!, 0) || !near(elsewhere[5]!, 0))
    failures.push(`a row on another body counts: ${JSON.stringify(elsewhere)}`);

  // 2. The realized split. Normal rows at each foot's point, asked for 10 N s
  // up with the centre of pressure at a point: the allocated impulses carry
  // the impulse whole and put their centre of pressure on the point, and,
  // the point's moment balance leaving freedom over more than two feet, the
  // least of them (the unknowns' regularization), n = A^T (A A^T)^-1 b over
  // the rows sum n = 10, sum n x = 10 cop_x, sum n z = 10 cop_z.
  // The unknowns' sqrt(eps) regularization weighs against the vertical row's
  // 0.02, so the split is met to a few micro newton seconds.
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-4;
  const realize = (
    name: string,
    feet: readonly { x: number; z: number }[],
    cop: { x: number; z: number },
    expected: readonly number[],
  ): void => {
    const plain: AutoMovieXpbdWorld.IObjective = {
      force: { x: 0.5, y: 0.02, z: 0.5 },
      pressure: { point: { x: cop.x, y: 0, z: cop.z }, weight: 15 },
    };
    const rows: solveXpbdSupportCascade.IRow[] = feet.map(
      (foot: { x: number; z: number }): solveXpbdSupportCascade.IRow => ({
        state: 0,
        point: { x: foot.x, y: 0, z: foot.z },
        direction: { x: 0, y: 1, z: 0 },
        velocity: 0,
      }),
    );
    const x: number[] | null = solveXpbdSupportCascade({
      k: feet.map((_, i: number): number[] =>
        feet.map((__, k: number): number => (i === k ? 1 : 0)),
      ),
      u: feet.map((): number => 0),
      columns: rows.map(
        (entry: solveXpbdSupportCascade.IRow, i: number): number[] =>
          solveXpbdArticulationContacts.objectiveRow(
            entry,
            { x: feet[i]!.x, y: 0, z: feet[i]!.z },
            counted,
            plain,
          ),
      ),
      target: [0, 10, 0, 0, 0],
      weights: [0.5, 0.02, 0.5, 15, 15],
      set: { rows, patches: [] },
      actuators: [],
      motion: [],
      warm: { first: [], second: [] },
    });
    if (x === null) {
      failures.push(`${name}: no solution`);
      return;
    }
    const total: number = x.reduce((sum: number, n: number) => sum + n, 0);
    const at = (key: "x" | "z"): number =>
      x.reduce(
        (sum: number, n: number, i: number) => sum + n * feet[i]![key],
        0,
      ) / total;
    if (!close(total, 10)) failures.push(`${name}: carries ${total} of 10`);
    if (!close(at("x"), cop.x) || !close(at("z"), cop.z))
      failures.push(`${name}: centre of pressure (${at("x")}, ${at("z")})`);
    if (!x.every((n: number, i: number): boolean => close(n, expected[i]!)))
      failures.push(`${name}: split ${JSON.stringify(x)}`);
  };
  realize(
    "two feet",
    [
      { x: -0.1, z: 0 },
      { x: 0.1, z: 0 },
    ],
    { x: 0.05, z: 0 },
    [2.5, 7.5],
  );
  realize(
    "two feet, the point on an edge",
    [
      { x: -0.1, z: 0 },
      { x: 0.1, z: 0 },
    ],
    { x: 0.1, z: 0 },
    [0, 10],
  );
  const four: { x: number; z: number }[] = [
    { x: 0.1, z: 0.2 },
    { x: 0.1, z: -0.2 },
    { x: -0.1, z: 0.2 },
    { x: -0.1, z: -0.2 },
  ];
  realize(
    "four feet",
    four,
    { x: 0.05, z: 0.05 },
    [4.375, 3.125, 1.875, 0.625],
  );
  realize(
    "four feet, the point on an edge",
    four,
    { x: 0.1, z: 0 },
    [5, 5, 0, 0],
  );
  TestValidator.equals("support objective", failures, []);
}
