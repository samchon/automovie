// Ported from IHMC Open Robotics Software (Apache-2.0), develop:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/controller/
// ICPControllerQPSolver.java compute() l.536-594, its tasks and constraints
// l.605-851 and solve() l.859-883; ICPControllerQPInputCalculator.java
// l.35-206 and l.216-280; ICPControllerQPConstraintCalculator.java l.29-176;
// qpInput/ConstraintToConvexRegion.java formulateConstraint() l.167-172 and
// getInequalityConstraintSize() l.179-198. See NOTICE.
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { solveDenseActiveSet } from "./solveDenseActiveSet";

/**
 * One solve of IHMC's capture-point feedback program over x = (dCoP, dCMP): the
 * centre of pressure's offset from its feed-forward and the pivot's offset from
 * the centre of pressure, with the angular momentum on, as Zulu's
 * `useAngularMomentum` sets it.
 *
 * Every term is in the reference's 1/2 x^T H x - h^T x form
 * (`ICPControllerQPSolver` l.45-53, l.861): a task (x - o)^T W (x - o) adds W
 * to H and W o to h. The program is strictly convex, the CoP and CMP feedback
 * weights being positive definite, so its minimizer is unique and the
 * reference's warm-started active set (l.865-866) changes only the iterations;
 * `solveDenseActiveSet` solves it cold.
 *
 * A program the solver cannot solve gives null, as `solve()` returns false
 * then (l.871-882).
 *
 * @param input The program's terms. Points and matrices are in the caller's
 *   horizontal frame, metres; weights are the reference's, the rate weights
 *   already divided by the control period squared.
 * @returns The feedback pair, or null.
 */
export function physicalIcpControllerQp(
  input: physicalIcpControllerQp.IInput,
): physicalIcpControllerQp.ISolution | null {
  const h: number[][] = Array.from({ length: 4 }, (): number[] =>
    new Array<number>(4).fill(0),
  );
  const g: number[] = new Array<number>(4).fill(0);

  // CoP feedback minimization dCoP^T Q dCoP (l.605-609; InputCalculator
  // l.35-38, l.216-224) and CMP feedback minimization dCMP^T Q dCMP
  // (l.614-618; l.50-53, l.234-242).
  addBlock(h, 0, 0, input.copWeight);
  addBlock(h, 2, 2, diagonal(input.cmpWeight));

  // Feedback rate (l.623-633; InputCalculator l.65-102, l.177-192,
  // l.252-261): each feedback toward its previous solution at the CoP-CMP
  // rate weight, and the total feedback dCoP + dCMP toward the previous
  // total at the feedback rate weight, whose cross blocks couple the two.
  // The previous total is their sum (l.913-918).
  const total: Polygon.IPoint = {
    x: input.previous.cop.x + input.previous.cmp.x,
    y: input.previous.cop.y + input.previous.cmp.y,
  };
  quadraticTask(h, g, 0, input.copCmpRateWeight, input.previous.cop);
  quadraticTask(h, g, 2, input.copCmpRateWeight, input.previous.cmp);
  quadraticTask(h, g, 0, input.rateWeight, total);
  quadraticTask(h, g, 2, input.rateWeight, total);
  addBlock(h, 0, 2, diagonal(input.rateWeight));
  addBlock(h, 2, 0, diagonal(input.rateWeight));

  // Dynamics (l.748-752; InputCalculator l.107-137, l.271-280): J x = e with
  // J = [K^-1, K^-1], weighted by w I: J^T w J into H and J^T w e into h.
  const inverse: physicalIcpControllerQp.IMatrix = invert(input.gains);
  const jacobian: number[][] = [0, 1].map((r: number): number[] => [
    inverse[r]![0],
    inverse[r]![1],
    inverse[r]![0],
    inverse[r]![1],
  ]);
  const dynamicsH: number[][] = Array.from(
    { length: 4 },
    (_: unknown, i: number): number[] =>
      Array.from(
        { length: 4 },
        (__: unknown, j: number): number =>
          input.dynamicsWeight *
          (jacobian[0]![i]! * jacobian[0]![j]! +
            jacobian[1]![i]! * jacobian[1]![j]!),
      ),
  );
  const dynamicsG: number[] = Array.from(
    { length: 4 },
    (_: unknown, i: number): number =>
      input.dynamicsWeight *
      (jacobian[0]![i]! * input.error.x + jacobian[1]![i]! * input.error.y),
  );
  submit(h, g, dynamicsH, dynamicsG);

  // Feedback direction (l.765-772; InputCalculator l.143-165): the cross
  // product of the feedback with the desired direction, d_y (dCoP + dCMP)_x
  // - d_x (dCoP + dCMP)_y, driven to zero. The reference multiply-adds this
  // row into the dynamics task's own input, never reset in between, and
  // submits that input again (l.770-771), so the program counts the
  // dynamics task twice whenever the direction weight is not zero; this
  // port keeps that. The direction is normalized as `setDesiredFeedbackDirection`
  // does (l.500-505): a zero direction has no normal, where the reference's
  // division gives not a number and its program fails, so the program fails
  // here before dividing.
  if (input.directionWeight !== 0) {
    const norm: number = Math.hypot(input.direction.x, input.direction.y);
    if (norm === 0) return null;
    const d: Polygon.IPoint = {
      x: input.direction.x * (1 / norm),
      y: input.direction.y * (1 / norm),
    };
    const row: number[] = [d.y, -d.x, d.y, -d.x];
    for (let i: number = 0; i < 4; i++)
      for (let j: number = 0; j < 4; j++)
        dynamicsH[i]![j]! += input.directionWeight * row[i]! * row[j]!;
    submit(h, g, dynamicsH, dynamicsG);
  }

  const rows: solveDenseActiveSet.IRow[] = [
    ...copRows(input),
    ...magnitudeRows(input.maximum),
    ...rateRows(input.rate, total),
  ];
  const solution: number[] | null = solveDenseActiveSet({
    quadratic: h,
    linear: g,
    rows,
  });
  return solution
    ? {
        cop: { x: solution[0]!, y: solution[1]! },
        cmp: { x: solution[2]!, y: solution[3]! },
      }
    : null;
}

/** The program's terms and solution. */
export namespace physicalIcpControllerQp {
  /** A 2 x 2 matrix, row by row. */
  export type IMatrix = readonly [
    readonly [number, number],
    readonly [number, number],
  ];

  /** The terms `ICPController` hands the solver each update. */
  export interface IInput {
    /** The capture point's error from its plan, dead-banded, metres. */
    error: Polygon.IPoint;

    /**
     * The feed-forward centre of pressure the feedback is added to, metres; it
     * offsets the support constraint (`ConstraintToConvexRegion` l.167-172).
     */
    feedForwardCop: Polygon.IPoint;

    /** The feedback gains K = 1 + K_p in the caller's frame. */
    gains: IMatrix;

    /** The CoP feedback weight in the caller's frame. */
    copWeight: IMatrix;

    /** The CMP feedback weight, the angular-momentum minimization weight. */
    cmpWeight: number;

    /** The dynamics task's weight. */
    dynamicsWeight: number;

    /** The desired feedback, K times the error, of any length. */
    direction: Polygon.IPoint;

    /** The feedback direction task's weight; zero drops the task. */
    directionWeight: number;

    /** The total feedback's rate weight, over the control period squared. */
    rateWeight: number;

    /** The CoP and CMP feedbacks' own rate weight, over the period squared. */
    copCmpRateWeight: number;

    /** The last solution, the rate tasks' objective, metres. */
    previous: ISolution;

    /**
     * The support polygon's vertices in any order, metres; its convex hull
     * constrains the centre of pressure, and none constrains it when empty.
     */
    support: readonly Polygon.IPoint[];

    /** How far inside the support the centre of pressure stays, metres. */
    safeDistance: number;

    /**
     * The total feedback's bound, |T (dCoP + dCMP)| per axis, with T the
     * transform into the plan's motion frame; infinite bounds add no row.
     */
    maximum: {
      transform: IMatrix;
      x: number;
      y: number;
    };

    /**
     * The total feedback's rate bound, metres per second, and the control
     * period, seconds; an infinite rate adds no row.
     */
    rate: {
      limit: number;
      dt: number;
    };
  }

  /** The program's solution. */
  export interface ISolution {
    /** The centre of pressure's feedback, metres. */
    cop: Polygon.IPoint;

    /** The pivot's offset from the centre of pressure, metres. */
    cmp: Polygon.IPoint;
  }
}

/**
 * The centre of pressure on the support's hull shrunk by the safe distance, as
 * rows on dCoP offset by the feed-forward: A (dCoP + o) <= b, so A dCoP <= b -
 * A o (`formulateCoPConstraint` l.660-669, `ConstraintToConvexRegion`
 * l.167-172, `addCoPLocationConstraint` l.643-658). An empty support adds none
 * (l.567-568, l.179-198).
 */
function copRows(
  input: physicalIcpControllerQp.IInput,
): solveDenseActiveSet.IRow[] {
  const hull: Polygon.IPoint[] = Polygon.hull(input.support);
  if (hull.length === 0) return [];
  return Polygon.rows(Polygon.shrink(hull, input.safeDistance)).map(
    (row: { a: [number, number]; b: number }): solveDenseActiveSet.IRow => ({
      a: [row.a[0], row.a[1], 0, 0],
      b:
        row.b -
        row.a[0] * input.feedForwardCop.x -
        row.a[1] * input.feedForwardCop.y,
    }),
  );
}

/**
 * The total feedback's magnitude bound (l.777-811;
 * `calculateMaxFeedbackMagnitudeConstraint` l.29-36, l.46-131): T (dCoP + dCMP)
 * within [-max, max] per axis. A row with an infinite bound holds for every x
 * and is left out, which leaves the minimizer unchanged.
 */
function magnitudeRows(
  maximum: physicalIcpControllerQp.IInput["maximum"],
): solveDenseActiveSet.IRow[] {
  const x: number = Math.abs(maximum.x);
  const y: number = Math.abs(maximum.y);
  if (x === Infinity && y === Infinity) return [];
  const t: physicalIcpControllerQp.IMatrix = maximum.transform;
  return [
    { a: [t[0][0], t[0][1], t[0][0], t[0][1]], b: x },
    { a: [t[1][0], t[1][1], t[1][0], t[1][1]], b: y },
    { a: [-t[0][0], -t[0][1], -t[0][0], -t[0][1]], b: x },
    { a: [-t[1][0], -t[1][1], -t[1][0], -t[1][1]], b: y },
  ].filter((row: solveDenseActiveSet.IRow): boolean => row.b !== Infinity);
}

/**
 * The total feedback's rate bound (l.816-851;
 * `calculateMaxFeedbackRateConstraint` l.142-176): dCoP + dCMP within the
 * previous total plus or minus dt times the rate, per axis.
 */
function rateRows(
  rate: physicalIcpControllerQp.IInput["rate"],
  total: Polygon.IPoint,
): solveDenseActiveSet.IRow[] {
  if (rate.limit === Infinity) return [];
  const step: number = rate.dt * rate.limit;
  return [
    { a: [1, 0, 1, 0], b: total.x + step },
    { a: [0, 1, 0, 1], b: total.y + step },
    { a: [-1, 0, -1, 0], b: -(total.x - step) },
    { a: [0, -1, 0, -1], b: -(total.y - step) },
  ];
}

/** A 2 x 2 matrix's inverse (`UnrolledInverseFromMinor_DDRM.inv`, l.113). */
function invert(
  m: physicalIcpControllerQp.IMatrix,
): physicalIcpControllerQp.IMatrix {
  const det: number = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  return [
    [m[1][1] / det, -m[0][1] / det],
    [-m[1][0] / det, m[0][0] / det],
  ];
}

/** A scalar times the 2 x 2 identity (`MatrixTools.setDiagonal`). */
function diagonal(value: number): physicalIcpControllerQp.IMatrix {
  return [
    [value, 0],
    [0, value],
  ];
}

/** A 2 x 2 block added into the 4 x 4 matrix at a row and column. */
function addBlock(
  target: number[][],
  row: number,
  column: number,
  block: physicalIcpControllerQp.IMatrix,
): void {
  for (let i: number = 0; i < 2; i++)
    for (let j: number = 0; j < 2; j++)
      target[row + i]![column + j]! += block[i]![j]!;
}

/**
 * (x - o)^T w (x - o) on the variable pair at an index (`computeQuadraticTask`
 * l.182-192): w on the block's diagonal, w o into the linear term.
 */
function quadraticTask(
  h: number[][],
  g: number[],
  index: number,
  weight: number,
  objective: Polygon.IPoint,
): void {
  addBlock(h, index, index, diagonal(weight));
  g[index]! += weight * objective.x;
  g[index + 1]! += weight * objective.y;
}

/** A task input's terms added to the program (`submitDynamicsTask` l.271-280). */
function submit(
  h: number[][],
  g: number[],
  taskH: readonly (readonly number[])[],
  taskG: readonly number[],
): void {
  for (let i: number = 0; i < 4; i++) {
    g[i]! += taskG[i]!;
    for (let j: number = 0; j < 4; j++) h[i]![j]! += taskH[i]![j]!;
  }
}
