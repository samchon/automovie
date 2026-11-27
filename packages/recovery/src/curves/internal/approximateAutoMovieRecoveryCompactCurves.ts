import { AutoMovieBernstein64 as B, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieCompactCurveApproximation,
  IAutoMovieConicApproximation,
  IAutoMoviePiecewisePlanarCurveSource,
  IAutoMovieRegisteredPlanarCurvePiece,
  IAutoMovieSingularDecomposition,
} from "@automovie/interface";

import { AutoMovieRecoveryCompactApproximation as C } from "../AutoMovieRecoveryCompactApproximation";
import { AutoMovieRecoveryConicApproximation as Q } from "../AutoMovieRecoveryConicApproximation";
import { approximateAutoMovieRecoveryConicsAhn } from "./approximateAutoMovieRecoveryConicsAhn";

/*
 * Refit whole smooth charts with storage-selected degree-three to degree-five
 * Bernstein pieces and optional positive bitangent conics. Old source knots
 * inform observation coverage but do not force output pieces.
 *
 * This is a degree-bounded adaptation of Schneider's endpoint-tangent fitting
 * and adaptive subdivision (Graphics Gems, 1990), not a reproduction of a
 * global minimum-control theorem. The existing engine's original-design Jacobi
 * SVD replaces two-handle normal equations and extends the interior controls:
 * https://github.com/erich666/GraphicsGems/blob/master/gems/FitCurves.c
 * https://www.netlib.org/lapack/lapack_routine/dgesvj.f
 *
 * Every polynomial fixes endpoint positions and forward tangent directions.
 * Trapezoid-weighted fitting nodes and distinct held-out quarter nodes inspect
 * every supplied source knot interval. Polynomial paired-point distances give
 * bidirectional geometric witnesses at those nodes, not a continuous bound.
 * Conics additionally use independent source-apex radial correspondences in
 * both directions. Finite samples cannot certify missed features, embedding,
 * Hausdorff error or likeness. No source observation is retained in the
 * result.
 */
export function approximateAutoMovieRecoveryCompactCurves(
  curve: IAutoMoviePiecewisePlanarCurveSource,
  options: IAutoMovieCompactCurveApproximation.IOptions,
): IAutoMovieCompactCurveApproximation.IResult {
  const diagnostics: string[] = Q.validate(curve, {
    toleranceMm: options.toleranceMm,
    maximumArcs: options.maximumPieces,
    maximumDepth: options.maximumDepth,
  });
  if (
    ![3, 4, 5, "mixed"].includes(options.degree) ||
    !Number.isSafeInteger(options.maximumQueries) ||
    options.maximumQueries < 1
  )
    diagnostics.push(
      "A supported degree and positive safe-integer query budget are required.",
    );
  if (
    curve.knots.some(
      (t: number): boolean =>
        !Number.isFinite(t) || t <= curve.domain.start || t >= curve.domain.end,
    )
  )
    diagnostics.push(
      "Source observation knots must lie strictly inside the finite domain.",
    );
  const pieces: IAutoMovieRegisteredPlanarCurvePiece[] = [];
  let queries: number = 0;
  let omitted: number = 0;

  /*
   * Report sampled coverage; source failure can explicitly clear prior pieces.
   */
  function result(
    refused: boolean = false,
  ): IAutoMovieCompactCurveApproximation.IResult {
    const retained: readonly IAutoMovieRegisteredPlanarCurvePiece[] = refused
      ? []
      : pieces;
    return {
      status:
        refused || retained.length === 0
          ? "refused"
          : omitted === 0
            ? "complete"
            : "partial",
      pieces: retained,
      maximumSampleErrorMm: retained.reduce(
        (n: number, p: IAutoMovieRegisteredPlanarCurvePiece): number =>
          Math.max(n, p.maximumSampleErrorMm),
        0,
      ),
      storedScalars: C.storedScalars(retained),
      queries,
      diagnostics,
      certified: false,
    };
  }
  if (diagnostics.length !== 0) return result(true);
  diagnostics.push(
    "Sampled degree-bounded refitting; no continuous Hausdorff, topology or global minimum-storage certificate.",
  );
  if (options.degree === "mixed")
    diagnostics.push(
      "Mixed candidates include bitangent conics and polynomial degrees 3/4/5; a whole analytic-oval fitter is not implemented.",
    );
  const observations: Map<number, Readonly<AutoMovieVector2Tuple>> = new Map();
  const queryLimit: Error = new Error(
    "Source query budget exhausted; unprocessed domains remain omitted.",
  );

  /*
   * Snapshot borrowed coordinates and bound all source callback work.
   */
  function observe(
    t: number,
    order?: 1 | 2 | 3 | 4 | 5,
    side?: "left" | "right",
  ): Readonly<AutoMovieVector2Tuple> {
    const cached: Readonly<AutoMovieVector2Tuple> | undefined =
      order === undefined ? observations.get(t) : undefined;
    if (cached !== undefined) return cached;
    if (queries >= options.maximumQueries) throw queryLimit;
    ++queries;
    const borrowed: Readonly<AutoMovieVector2Tuple> =
      order === undefined
        ? curve.evaluate(t)
        : curve.derivative(t, order, side);
    const p: Readonly<AutoMovieVector2Tuple> = [borrowed[0], borrowed[1]];
    if (order === undefined) observations.set(t, p);
    return p;
  }
  const support: number[] = [
    ...new Set([
      curve.domain.start,
      ...curve.knots,
      ...curve.breaks,
      curve.domain.end,
    ]),
  ].sort((a: number, b: number): number => a - b);

  /*
   * Find the first source support greater than a, without scanning old knots.
   */
  function upper(a: number): number {
    let lo: number = 0;
    let hi: number = support.length;
    while (lo < hi) {
      const middle: number = (lo + hi) >>> 1;
      if (support[middle]! <= a) lo = middle + 1;
      else hi = middle;
    }
    return lo;
  }

  /*
   * Fitting midpoints and held-out quarters cover every original source piece.
   */
  function nodes(
    a: number,
    b: number,
  ): { fitting: number[]; validation: number[] } {
    const partition: number[] = [a];
    for (let i: number = upper(a); i < support.length && support[i]! < b; ++i)
      partition.push(support[i]!);
    partition.push(b);
    const fitting: Set<number> = new Set(partition);
    const validation: Set<number> = new Set();
    for (let i: number = 1; i < partition.length; ++i) {
      const left: number = partition[i - 1]!;
      const width: number = partition[i]! - left;
      fitting.add(left + width / 2);
      validation.add(left + width / 4);
      validation.add(left + (3 * width) / 4);
    }
    for (let i: number = 0; i <= 16; ++i) fitting.add(a + ((b - a) * i) / 16);
    for (let i: number = 0; i < 33; ++i)
      validation.add(a + ((b - a) * (i + 0.5)) / 33);
    return {
      fitting: [...fitting].sort((x: number, y: number): number => x - y),
      validation: [...validation]
        .filter((t: number): boolean => !fitting.has(t))
        .sort((x: number, y: number): number => x - y),
    };
  }

  /*
   * Weighted original-design solve with fixed endpoints and forward tangents.
   */
  function polynomial(
    a: number,
    b: number,
    degree: 3 | 4 | 5,
    at: readonly number[],
  ): IAutoMovieRegisteredPlanarCurvePiece | undefined {
    const p: Readonly<AutoMovieVector2Tuple> = observe(a);
    const q: Readonly<AutoMovieVector2Tuple> = observe(b);
    const left: Readonly<AutoMovieVector2Tuple> = observe(a, 1, "right");
    const right: Readonly<AutoMovieVector2Tuple> = observe(b, 1, "left");
    const ln: number = Math.hypot(...left);
    const rn: number = Math.hypot(...right);
    if (ln === 0 || rn === 0) return undefined;
    const u: Readonly<AutoMovieVector2Tuple> = [left[0] / ln, left[1] / ln];
    const v: Readonly<AutoMovieVector2Tuple> = [right[0] / rn, right[1] / rn];
    const width: number = 2 + 2 * (degree - 3);
    const rows: number[][] = [];
    const values: number[] = [];
    for (let i: number = 1; i < at.length - 1; ++i) {
      const t: number = at[i]!;
      const local: number = (t - a) / (b - a);
      const basis: number[] = Array.from(
        { length: degree + 1 },
        (_x: unknown, k: number): number =>
          B.choose(degree, k) * local ** k * (1 - local) ** (degree - k),
      );
      const scale: number = Math.sqrt(
        (at[i + 1]! - at[i - 1]!) / (2 * (b - a)),
      );
      const point: Readonly<AutoMovieVector2Tuple> = observe(t);
      for (let axis: number = 0; axis < 2; ++axis) {
        const row: number[] = new Array<number>(width).fill(0);
        row[0] = basis[1]! * u[axis]! * scale;
        row[1] = -basis[degree - 1]! * v[axis]! * scale;
        for (let j: number = 2; j <= degree - 2; ++j)
          row[2 + 2 * (j - 2) + axis] = basis[j]! * scale;
        rows.push(row);
        values.push(
          (point[axis]! -
            p[axis]! -
            (basis[degree - 1]! + basis[degree]!) * (q[axis]! - p[axis]!)) *
            scale,
        );
      }
    }
    let decomposition: IAutoMovieSingularDecomposition;
    try {
      decomposition = AutoMovieEngineMath.decomposeSingularMatrix(rows, {
        maxEntries: Math.max(rows.length * width, width * width),
        maxSweeps: 40,
        orthogonalityTolerance: 128 * Number.EPSILON,
      });
    } catch {
      return undefined;
    }
    if (decomposition.numericalRank !== width) return undefined;
    const solution: number[] = new Array<number>(width).fill(0);
    for (let k: number = 0; k < width; ++k) {
      const projection: number =
        decomposition.leftColumns[k]!.reduce(
          (s: number, value: number, i: number): number =>
            s + value * values[i]!,
          0,
        ) / decomposition.singularValues[k]!;
      for (let j: number = 0; j < width; ++j)
        solution[j] += projection * decomposition.rightColumns[k]![j]!;
    }
    if (
      solution.some(
        (value: number): boolean => value === Infinity || value === -Infinity,
      ) ||
      solution[0]! <= 0 ||
      solution[1]! <= 0
    )
      return undefined;
    const controls: Readonly<AutoMovieVector2Tuple>[] = [
      p,
      [p[0] + solution[0]! * u[0], p[1] + solution[0]! * u[1]],
    ];
    for (let j: number = 2; j <= degree - 2; ++j)
      controls.push([
        p[0] + solution[2 + 2 * (j - 2)]!,
        p[1] + solution[3 + 2 * (j - 2)]!,
      ]);
    controls.push([q[0] - solution[1]! * v[0], q[1] - solution[1]! * v[1]], q);
    return {
      kind: "polynomial",
      degree,
      domain: [a, b],
      controls,
      maximumSampleErrorMm: 0,
    };
  }

  /*
   * Linear source registration supplies paired witnesses in both directions.
   */
  function verifyPolynomial(
    piece: IAutoMovieRegisteredPlanarCurvePiece,
    at: readonly number[],
  ): number {
    let maximum: number = 0;
    for (const t of at) {
      const p: Readonly<AutoMovieVector2Tuple> = observe(t);
      const q: Readonly<AutoMovieVector2Tuple> = C.evaluate(
        piece,
        (t - piece.domain[0]) / (piece.domain[1] - piece.domain[0]),
      );
      maximum = Math.max(maximum, Q.distance(p, q));
    }
    return maximum;
  }

  /*
   * Independently check the conic's apex-ray chart, including reverse samples.
   */
  function verifyConic(
    piece: IAutoMovieRegisteredPlanarCurvePiece & { kind: "conic" },
    at: readonly number[],
  ): number {
    const p: Readonly<AutoMovieVector2Tuple> = piece.controls[0];
    const x: Readonly<AutoMovieVector2Tuple> = [
      piece.controls[1][0] - p[0],
      piece.controls[1][1] - p[1],
    ];
    const y: Readonly<AutoMovieVector2Tuple> = [
      piece.controls[2][0] - p[0],
      piece.controls[2][1] - p[1],
    ];
    const area: number = Q.cross(x, y);

    /*
     * Recover rational u from source barycentric coordinates along an apex ray,
     * or null outside the triangle or on a degenerate ray.
     */
    function radial(t: number): number | null {
      if (t === piece.domain[0]) return 0;
      if (t === piece.domain[1]) return 1;
      const q: Readonly<AutoMovieVector2Tuple> = observe(t);
      const delta: Readonly<AutoMovieVector2Tuple> = [q[0] - p[0], q[1] - p[1]];
      if (area === 0) {
        const length: number = y[0] ** 2 + y[1] ** 2;
        return length === 0
          ? null
          : (delta[0] * y[0] + delta[1] * y[1]) / length;
      }
      const b1: number = Q.cross(delta, y) / area;
      const b2: number = Q.cross(x, delta) / area;
      const b0: number = 1 - b1 - b2;
      return b0 < 0 || b2 < 0 || b0 + b2 === 0
        ? null
        : Math.sqrt(b2) / (Math.sqrt(b0) + Math.sqrt(b2));
    }
    let maximum: number = 0;
    let previous: number = -Infinity;
    for (const t of at) {
      const u: number | null = radial(t);
      if (u === null || u < previous || u < 0 || u > 1) return Infinity;
      previous = u;
      maximum = Math.max(maximum, Q.distance(observe(t), C.evaluate(piece, u)));
    }
    for (let i: number = 0; i < 33; ++i) {
      const u: number = (i + 0.5) / 33;
      let low: number = piece.domain[0];
      let high: number = piece.domain[1];
      for (let j: number = 0; j < 28; ++j) {
        const middle: number = (low + high) / 2;
        const value: number | null = radial(middle);
        if (value !== null && value < u) low = middle;
        else high = middle;
      }
      maximum = Math.max(
        maximum,
        Q.distance(observe((low + high) / 2), C.evaluate(piece, u)),
      );
    }
    return maximum;
  }

  /*
   * A leaf carries no old source span ownership.
   */
  interface Interval {
    a: number;
    b: number;
    depth: number;
  }
  const boundaries: Set<number> = new Set([
    curve.domain.start,
    ...curve.breaks,
    curve.domain.end,
  ]);
  if (curve.closed)
    for (let i: number = 1; i < 4; ++i)
      boundaries.add(
        curve.domain.start + ((curve.domain.end - curve.domain.start) * i) / 4,
      );
  const ordered: number[] = [...boundaries].sort(
    (a: number, b: number): number => a - b,
  );
  if (ordered.length - 1 > options.maximumPieces) {
    diagnostics.push("Initial feature charts exceed the piece budget.");
    return result(true);
  }
  const pending: Interval[] = [];
  for (let i: number = ordered.length - 2; i >= 0; --i)
    pending.push({ a: ordered[i]!, b: ordered[i + 1]!, depth: 0 });
  let leaves: number = pending.length;
  try {
    while (pending.length !== 0) {
      const interval: Interval = pending.pop()!;
      const { a, b, depth } = interval;
      const sample: { fitting: number[]; validation: number[] } = nodes(a, b);
      const validation: number[] = [
        ...new Set([...sample.fitting, ...sample.validation]),
      ].sort((x: number, y: number): number => x - y);
      let accepted: IAutoMovieRegisteredPlanarCurvePiece | undefined;
      if (options.degree === "mixed") {
        const conic: IAutoMovieConicApproximation.IResult =
          approximateAutoMovieRecoveryConicsAhn(
            {
              domain: { start: a, end: b },
              breaks: [],
              closed: false,
              evaluate: (t: number): Readonly<AutoMovieVector2Tuple> =>
                observe(t),
              derivative: (
                t: number,
                order: 1 | 2 | 3 | 4 | 5,
                side?: "left" | "right",
              ): Readonly<AutoMovieVector2Tuple> => observe(t, order, side),
            },
            {
              toleranceMm: options.toleranceMm,
              maximumArcs: 1,
              maximumDepth: 1,
            },
          );
        if (conic.status === "complete" && conic.arcs.length === 1) {
          const candidate: IAutoMovieRegisteredPlanarCurvePiece & {
            kind: "conic";
          } = { ...conic.arcs[0]!, kind: "conic" };
          candidate.maximumSampleErrorMm = Math.max(
            candidate.maximumSampleErrorMm,
            verifyConic(candidate, validation),
          );
          if (candidate.maximumSampleErrorMm <= options.toleranceMm)
            accepted = candidate;
        }
      }
      const degrees: readonly (3 | 4 | 5)[] =
        options.degree === "mixed" ? [3, 4, 5] : [options.degree];
      for (const degree of degrees) {
        if (accepted !== undefined) break;
        const candidate: IAutoMovieRegisteredPlanarCurvePiece | undefined =
          polynomial(a, b, degree, sample.fitting);
        if (candidate === undefined) continue;
        candidate.maximumSampleErrorMm = verifyPolynomial(
          candidate,
          validation,
        );
        if (candidate.maximumSampleErrorMm <= options.toleranceMm)
          accepted = candidate;
      }
      if (accepted !== undefined) {
        pieces.push(accepted);
        continue;
      }
      const middle: number = (a + b) / 2;
      if (
        depth >= options.maximumDepth ||
        leaves >= options.maximumPieces ||
        middle === a ||
        middle === b
      ) {
        ++omitted;
        continue;
      }
      ++leaves;
      pending.push(
        { a: middle, b, depth: depth + 1 },
        { a, b: middle, depth: depth + 1 },
      );
    }
  } catch (error) {
    if (error === queryLimit) {
      omitted += pending.length + 1;
      diagnostics.push(queryLimit.message);
    } else {
      diagnostics.push(
        `Source failure: ${error instanceof Error ? error.message : String(error)}`,
      );
      return result(true);
    }
  }
  if (omitted !== 0)
    diagnostics.push(
      `${omitted} source domain(s) omitted after piece, depth, query or numerical admission limits.`,
    );
  return result();
}
