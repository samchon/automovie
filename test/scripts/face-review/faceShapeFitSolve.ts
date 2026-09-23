/**
 * One bounded, regularized least-squares step of the photograph shape fit.
 *
 * `fit-face-landmarks.ts` linearizes a document around its built surface: the
 * landmark points are `x = B + sum_c (u_c - u0_c) P_c + (v_c - v0_c) N_c`,
 * where `u_c` and `v_c` are the channel's positive and negative endpoint
 * weights (the builder's `p + |w| delta` with the endpoint chosen by sign, so
 * `w = u - v`), `P_c` and `N_c` their per-landmark displacements, and `B` the
 * built positions at the current weights `u0`, `v0`. The fit minimizes
 *
 *   sum_k omega_k |S(project(x_k)) - y_k|^2 / iod^2
 *     + lambda sum_c ((u_c - u0_c)^2 + (v_c - v0_c)^2)
 *     + mu sum_pairs (w_left - w_right)^2
 *
 * over `0 <= u_c <= max_c`, `0 <= v_c <= -min_c`: detector landmarks `y_k`
 * of the photograph, the 2D similarity `S` that best maps the projected
 * model landmarks onto them (its four parameters are Gauss-Newton variables
 * beside the shape and are refitted in closed form every iteration, so
 * position, scale and roll are never charged to shape), a Gaussian prior centred on the
 * current document (MAP with landmark noise sigma_n and parameter spread
 * sigma_p gives lambda = (sigma_n / sigma_p)^2), and a symmetry prior on
 * paired left and right channels, because a face is nearly symmetric and a
 * photograph's residual head pose would otherwise be absorbed as one-sided
 * shape. The projection is linearized per iteration (Gauss-Newton); each
 * iteration's quadratic is solved exactly under the box constraints by a
 * primal active-set method. The result is a set of shared channel weights,
 * never a vertex, and the caller rebuilds the document to relinearize.
 * Pure: inputs are read, new arrays are returned.
 */
import {
  type FaceLikenessPoint,
  applyFaceLikenessSimilarity,
  fitFaceLikenessSimilarity,
} from "./faceLikenessGeometry";
import {
  type IFaceShapeFitView,
  faceShapeFitProject,
} from "./faceShapeFitCamera";

/** One fitted variable: a channel side with its bounds and displacements. */
export interface IFaceShapeFitVariable {
  channel: string;
  side: "positive" | "negative";
  /** Current weight magnitude on this side, the linearization point. */
  current: number;
  /** Upper bound of the magnitude; the lower bound is zero. */
  maximum: number;
  /** Displacement of each landmark at magnitude one, metres. */
  displacement: readonly (readonly [number, number, number])[];
}

/** Everything one fit step reads. */
export interface IFaceShapeFitProblem {
  /** Built landmark points at the current weights, metres. */
  base: readonly (readonly [number, number, number])[];
  /** Photograph landmarks, pixels; null excludes a landmark. */
  target: readonly (FaceLikenessPoint | null)[];
  /** Per-landmark weight omega_k. */
  weight: readonly number[];
  view: IFaceShapeFitView;
  variables: readonly IFaceShapeFitVariable[];
  /** Pairs of channel ids expected to be symmetric. */
  pairs: readonly (readonly [string, string])[];
  lambda: number;
  mu: number;
  /** Reference inter-ocular distance of the photograph, pixels. */
  interocular: number;
  iterations: number;
}

/** Fitted magnitudes per variable and the data cost before and after. */
export function solveFaceShapeFit(problem: IFaceShapeFitProblem): {
  magnitudes: number[];
  costBefore: number;
  costAfter: number;
} {
  const n = problem.variables.length;
  const used = problem.target.flatMap((y, k) =>
    y === null || (problem.weight[k] ?? 0) === 0 ? [] : [k],
  );
  if (used.length < 3)
    throw new Error("A shape fit needs at least three landmarks.");
  let x = problem.variables.map((variable) => variable.current);
  const points = (magnitudes: readonly number[]) =>
    problem.base.map((point, k) =>
      [0, 1, 2].map(
        (axis) =>
          point[axis]! +
          problem.variables.reduce(
            (sum, variable, i) =>
              sum +
              (magnitudes[i]! - variable.current) *
                variable.displacement[k]![axis]!,
            0,
          ),
      ),
    );
  const dataCost = (magnitudes: readonly number[]): number => {
    const projected = points(magnitudes).map((point) =>
      faceShapeFitProject(problem.view, point),
    );
    const similarity = fit(projected);
    return used.reduce((sum, k) => {
      const [px, py] = applyFaceLikenessSimilarity(similarity, projected[k]!);
      const [tx, ty] = problem.target[k]!;
      return (
        sum +
        (problem.weight[k]! * ((px - tx) ** 2 + (py - ty) ** 2)) /
          problem.interocular ** 2
      );
    }, 0);
  };
  const fit = (projected: readonly FaceLikenessPoint[]) =>
    fitFaceLikenessSimilarity(
      used.map((k) => projected[k]!),
      used.map((k) => problem.target[k]!),
      used.map((_, i) => i),
    );
  const costBefore = dataCost(x);
  for (let iteration = 0; iteration < problem.iterations; ++iteration) {
    const world = points(x);
    const projected = world.map((point) =>
      faceShapeFitProject(problem.view, point),
    );
    const s = fit(projected);
    // Residual rows r = S(P(x)) - y and their Jacobian by magnitude.
    const rows: { r: number; g: number[]; w: number }[] = [];
    for (const k of used) {
      const [px, py] = applyFaceLikenessSimilarity(s, projected[k]!);
      const jp = projectionJacobian(problem.view, world[k]!);
      const w = problem.weight[k]! / problem.interocular ** 2;
      const gx: number[] = [];
      const gy: number[] = [];
      for (const variable of problem.variables) {
        const d = variable.displacement[k]!;
        const du = jp[0].reduce(
          (sum, value, axis) => sum + value * d[axis]!,
          0,
        );
        const dv = jp[1].reduce(
          (sum, value, axis) => sum + value * d[axis]!,
          0,
        );
        gx.push(s.a * du - s.b * dv);
        gy.push(s.b * du + s.a * dv);
      }
      // The similarity's own four parameters (a, b, tx, ty) move with the
      // shape, so the step charges shape only what the similarity cannot.
      const [u, v] = projected[k]!;
      gx.push(u, -v, 1, 0);
      gy.push(v, u, 0, 1);
      rows.push({ r: px - problem.target[k]![0], g: gx, w });
      rows.push({ r: py - problem.target[k]![1], g: gy, w });
    }
    // Quadratic model in the step delta: 1/2 delta' H delta + b' delta,
    // over the shape magnitudes followed by the four similarity parameters.
    const m = n + 4;
    const H = Array.from({ length: m }, () => new Array<number>(m).fill(0));
    const b = new Array<number>(m).fill(0);
    for (const row of rows)
      for (let i = 0; i < m; ++i) {
        if (row.g[i] === 0) continue;
        b[i] += row.w * row.g[i]! * row.r;
        for (let j = 0; j < m; ++j) H[i]![j] += row.w * row.g[i]! * row.g[j]!;
      }
    problem.variables.forEach((variable, i) => {
      H[i]![i] += problem.lambda;
      b[i] += problem.lambda * (x[i]! - variable.current);
    });
    const signed = (i: number) =>
      problem.variables[i]!.side === "positive" ? 1 : -1;
    for (const [left, right] of problem.pairs) {
      const l = problem.variables.flatMap((v, i) =>
        v.channel === left ? [i] : [],
      );
      const r = problem.variables.flatMap((v, i) =>
        v.channel === right ? [i] : [],
      );
      const difference =
        l.reduce((sum, i) => sum + signed(i) * x[i]!, 0) -
        r.reduce((sum, i) => sum + signed(i) * x[i]!, 0);
      const terms = [
        ...l.map((i) => [i, signed(i)]),
        ...r.map((i) => [i, -signed(i)]),
      ];
      for (const [i, si] of terms) {
        b[i!] += problem.mu * si! * difference;
        for (const [j, sj] of terms) H[i!]![j!] += problem.mu * si! * sj!;
      }
    }
    const step = boundedQuadratic(
      H,
      b,
      [...x.map((value) => -value), ...new Array<number>(4).fill(-Infinity)],
      [
        ...problem.variables.map((variable, i) => variable.maximum - x[i]!),
        ...new Array<number>(4).fill(Infinity),
      ],
    );
    // The similarity is refitted in closed form at the next iteration.
    x = x.map((value, i) => value + step[i]!);
  }
  return { magnitudes: x, costBefore, costAfter: dataCost(x) };
}

/**
 * Minimize 1/2 d'Hd + b'd subject to lower <= d <= upper by a primal
 * active-set method; H must be symmetric positive definite.
 */
export function boundedQuadratic(
  H: readonly (readonly number[])[],
  b: readonly number[],
  lower: readonly number[],
  upper: readonly number[],
): number[] {
  const n = b.length;
  const d = new Array<number>(n)
    .fill(0)
    .map((_, i) => Math.min(upper[i]!, Math.max(lower[i]!, 0)));
  const fixed = new Set<number>();
  for (let round = 0; round < 4 * n + 8; ++round) {
    const free = [...new Array<number>(n).keys()].filter((i) => !fixed.has(i));
    // Unconstrained minimizer over the free set with the others held.
    const rhs = free.map(
      (i) =>
        -(b[i]! + [...fixed].reduce((sum, j) => sum + H[i]![j]! * d[j]!, 0)),
    );
    const target = solve(
      free.map((i) => free.map((j) => H[i]![j]!)),
      rhs,
    );
    let alpha = 1;
    let blocking = -1;
    free.forEach((i, at) => {
      const move = target[at]! - d[i]!;
      if (move > 0 && d[i]! + move > upper[i]!) {
        const limit = (upper[i]! - d[i]!) / move;
        if (limit < alpha) [alpha, blocking] = [limit, i];
      } else if (move < 0 && d[i]! + move < lower[i]!) {
        const limit = (lower[i]! - d[i]!) / move;
        if (limit < alpha) [alpha, blocking] = [limit, i];
      }
    });
    free.forEach((i, at) => (d[i] = d[i]! + alpha * (target[at]! - d[i]!)));
    if (blocking >= 0) {
      d[blocking] =
        d[blocking]! > (lower[blocking]! + upper[blocking]!) / 2
          ? upper[blocking]!
          : lower[blocking]!;
      fixed.add(blocking);
      continue;
    }
    // Release one bound variable whose gradient points into the box.
    let release = -1;
    let best = 0;
    for (const i of fixed) {
      const gradient =
        b[i]! + H[i]!.reduce((sum, value, j) => sum + value * d[j]!, 0);
      const inward = d[i]! <= lower[i]! ? -gradient : gradient;
      if (inward > best + 1e-15) [best, release] = [inward, i];
    }
    if (release < 0) return d;
    fixed.delete(release);
  }
  return d;
}

/** d(pixel)/d(point) of the capture projection, two rows of three. */
function projectionJacobian(
  view: IFaceShapeFitView,
  point: readonly number[],
): [number[], number[]] {
  const offset = [0, 1, 2].map((k) => point[k]! - view.eye[k]!);
  const depth = offset.reduce(
    (sum, value, k) => sum + value * view.forward[k]!,
    0,
  );
  const a = offset.reduce((sum, value, k) => sum + value * view.right[k]!, 0);
  const c = offset.reduce((sum, value, k) => sum + value * view.up[k]!, 0);
  const scale = view.viewport / (2 * view.halfTangent);
  return [
    [0, 1, 2].map(
      (k) =>
        (scale * (view.right[k]! * depth - a * view.forward[k]!)) / depth ** 2,
    ),
    [0, 1, 2].map(
      (k) =>
        (-scale * (view.up[k]! * depth - c * view.forward[k]!)) / depth ** 2,
    ),
  ];
}

/** Gaussian elimination with partial pivoting; refuses a singular system. */
function solve(matrix: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const m = matrix.map((row, i) => [...row, rhs[i]!]);
  for (let column = 0; column < n; ++column) {
    let pivot = column;
    for (let row = column + 1; row < n; ++row)
      if (Math.abs(m[row]![column]!) > Math.abs(m[pivot]![column]!))
        pivot = row;
    if (Math.abs(m[pivot]![column]!) < 1e-300)
      throw new Error("The shape fit system is singular.");
    [m[column], m[pivot]] = [m[pivot]!, m[column]!];
    for (let row = 0; row < n; ++row) {
      if (row === column) continue;
      const factor = m[row]![column]! / m[column]![column]!;
      if (factor === 0) continue;
      for (let k = column; k <= n; ++k) m[row]![k] -= factor * m[column]![k]!;
    }
  }
  return m.map((row, i) => row[n]! / row[i]!);
}
