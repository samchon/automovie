/**
 * A small dense convex quadratic program by the dual active-set method of
 * Goldfarb and Idnani (1983, "A numerically stable dual method for solving
 * strictly convex quadratic programs", Mathematical Programming 27): `min 1/2
 * x^T diag(g) x + c^T x` subject to equality rows `a x = v` and inequality rows
 * `a x >= v`, with every `g_i > 0`.
 *
 * The method starts at the unconstrained minimum, which is dual feasible, and
 * adds violated rows one at a time, keeping the multipliers of the active
 * inequalities nonnegative: a full step makes the added row active, a partial
 * step drops the active row whose multiplier reached zero first. It keeps `J =
 * L^-T Q` and the upper triangle `R` of `J^T N = [R; 0]` (`L` the Cholesky
 * factor of the objective's diagonal, `N` the active rows) by Givens rotations,
 * so adding or dropping a row costs `O(n^2)`. Equalities are added first and
 * never dropped; one whose row lies in the span of the rows already active is
 * left out, since it holds with them or not at all.
 *
 * The previous solve's active inequalities warm-start the next: among the
 * violated rows the method picks a preferred one first (any violated row is a
 * valid choice of the dual method), so a solve whose active set did not change
 * adds exactly those rows and drops none. The objective's diagonal factor `L`
 * is the same for every solve of one diagonal.
 *
 * @param problem The objective, the rows and the preferred inequalities.
 * @returns The minimizer and its active inequalities, or null when the rows are
 *   infeasible or the method does not finish within its bound.
 */
export function solveXpbdDualActiveSet(
  problem: solveXpbdDualActiveSet.IProblem,
): solveXpbdDualActiveSet.IResult | null {
  const n: number = problem.diagonal.length;
  const j: Float64Array[] = Array.from(
    { length: n },
    (_: unknown, row: number): Float64Array => {
      const line: Float64Array = new Float64Array(n);
      line[row] = 1 / Math.sqrt(problem.diagonal[row]!);
      return line;
    },
  );
  const r: Float64Array[] = Array.from(
    { length: n },
    (): Float64Array => new Float64Array(n),
  );
  const x: Float64Array = Float64Array.from(
    problem.linear,
    (value: number, i: number): number => -value / problem.diagonal[i]!,
  );
  const active: number[] = [];
  const u: number[] = [];
  const normals: Float64Array[] = [];
  const values: number[] = [];
  const d: Float64Array = new Float64Array(n);
  const z: Float64Array = new Float64Array(n);
  const change: Float64Array = new Float64Array(n);

  const dense = (row: solveXpbdDualActiveSet.IRow): Float64Array => {
    const values: Float64Array = new Float64Array(n);
    for (let k: number = 0; k < row.indices.length; ++k)
      values[row.indices[k]!]! += row.weights[k]!;
    return values;
  };
  // A dense row's nonzero entries in ascending order: the products the
  // dense inner products add, the zero ones adding nothing.
  const support = (a: Float64Array): number[] => {
    const at: number[] = [];
    for (let i: number = 0; i < n; ++i) if (a[i] !== 0) at.push(i);
    return at;
  };
  const slack = (row: solveXpbdDualActiveSet.IRow): number => {
    let sum: number = -row.value;
    for (let k: number = 0; k < row.indices.length; ++k)
      sum += row.weights[k]! * x[row.indices[k]!]!;
    return sum;
  };
  // The rounding scale of a row's value at x: gamma_m (|v| + |a|^T |x|),
  // m the inner product's length (Higham 2002, sec. 3.1).
  const rounding = (row: solveXpbdDualActiveSet.IRow): number => {
    let sum: number = Math.abs(row.value);
    for (let k: number = 0; k < row.indices.length; ++k)
      sum += Math.abs(row.weights[k]! * x[row.indices[k]!]!);
    return (row.indices.length + 1) * Number.EPSILON * sum;
  };
  // d = J^T a, z = J2 d2 (the step direction), change = R^-1 d1 (the
  // multipliers' change); returns d2^T d2 = z^T a. J^T a reads only a's
  // nonzero entries (`support`), in the dense product's order, so it costs
  // O(n nnz) rather than O(n^2) (Goldfarb and Idnani 1983, sec. 4, d = J^T n+).
  const direction = (a: Float64Array, at: readonly number[]): number => {
    const q: number = active.length;
    // Each entry's terms are added in the same order as a column-by-column
    // product, row by row, so the loops run along J's stored rows.
    d.fill(0);
    for (const row of at) {
      const line: Float64Array = j[row]!;
      const coefficient: number = a[row]!;
      for (let col: number = 0; col < n; ++col)
        d[col]! += line[col]! * coefficient;
    }
    let outside: number = 0;
    for (let col: number = q; col < n; ++col) outside += d[col]! * d[col]!;
    for (let row: number = 0; row < n; ++row) {
      const line: Float64Array = j[row]!;
      let sum: number = 0;
      for (let col: number = q; col < n; ++col) sum += line[col]! * d[col]!;
      z[row] = sum;
    }
    for (let i: number = q - 1; i >= 0; --i) {
      let sum: number = d[i]!;
      for (let k: number = i + 1; k < q; ++k) sum -= r[i]![k]! * change[k]!;
      change[i] = sum / r[i]![i]!;
    }
    return outside;
  };
  // Whether a's component outside the active rows' span, in the
  // objective's metric, is at most `share` of a.
  const dependent = (outside: number, share: number): boolean => {
    let all: number = 0;
    for (let col: number = 0; col < n; ++col) all += d[col]! * d[col]!;
    return !(outside > share * share * all);
  };
  // Rotate d's tail onto its q-th entry, carrying J, and append it to R.
  const add = (): void => {
    const q: number = active.length;
    // The rotations depend on d alone, so they are found first and then
    // carried along each of J's rows in the same order.
    const rotations: number[] = [];
    for (let col: number = n - 1; col > q; --col) {
      const length: number = Math.hypot(d[col - 1]!, d[col]!);
      if (length === 0) continue;
      rotations.push(col, d[col - 1]! / length, d[col]! / length);
      d[col - 1] = length;
      d[col] = 0;
    }
    rotate(rotations, -1);
    for (let row: number = 0; row <= q; ++row) r[row]![q] = d[row]!;
  };
  // Drop the active row at position l and restore R's triangle.
  const drop = (l: number): void => {
    const q: number = active.length;
    if (active[l]! >= 0) holding[active[l]!] = 0;
    active.splice(l, 1);
    u.splice(l, 1);
    normals.splice(l, 1);
    values.splice(l, 1);
    for (let col: number = l; col < q - 1; ++col)
      for (let row: number = 0; row < q; ++row)
        r[row]![col] = r[row]![col + 1]!;
    for (let row: number = 0; row < q; ++row) r[row]![q - 1] = 0;
    // R's rotations depend on R alone, so J's are carried after them, along
    // each of its rows in the same order.
    const rotations: number[] = [];
    for (let col: number = l; col < q - 1; ++col) {
      const length: number = Math.hypot(r[col]![col]!, r[col + 1]![col]!);
      if (length === 0) continue;
      const cos: number = r[col]![col]! / length;
      const sin: number = r[col + 1]![col]! / length;
      for (let k: number = col; k < q - 1; ++k) {
        const first: number = r[col]![k]!;
        const second: number = r[col + 1]![k]!;
        r[col]![k] = cos * first + sin * second;
        r[col + 1]![k] = -sin * first + cos * second;
      }
      rotations.push(col, cos, sin);
    }
    rotate(rotations, 0);
  };
  // Givens rotations of J's column pairs (col + offset, col + offset + 1)
  // for each (col, cos, sin) in order, applied row by row (Golub and Van
  // Loan 2013, sec. 5.1.8).
  const rotate = (rotations: readonly number[], offset: number): void => {
    if (rotations.length === 0) return;
    for (let row: number = 0; row < n; ++row) {
      const line: Float64Array = j[row]!;
      for (let k: number = 0; k < rotations.length; k += 3) {
        const lower: number = rotations[k]! + offset;
        const cos: number = rotations[k + 1]!;
        const sin: number = rotations[k + 2]!;
        const first: number = line[lower]!;
        const second: number = line[lower + 1]!;
        line[lower] = cos * first + sin * second;
        line[lower + 1] = -sin * first + cos * second;
      }
    }
  };
  // The duality gap of x and the multipliers: the primal objective less the
  // Lagrangian dual `q(u) = u^T v - 1/2 (A^T u - c)^T G^-1 (A^T u - c)`,
  // which bounds the optimum from below for any u with nonnegative
  // inequality entries, so a small gap certifies x as the optimum.
  const certified = (): boolean => {
    let primal: number = 0;
    const gradient: Float64Array = Float64Array.from(
      problem.linear,
      (value: number): number => -value,
    );
    let dual: number = 0;
    for (let k: number = 0; k < normals.length; ++k) {
      if (active[k]! >= 0 && u[k]! < 0) return false;
      const a: Float64Array = normals[k]!;
      for (let i: number = 0; i < n; ++i) gradient[i]! += u[k]! * a[i]!;
      dual += u[k]! * values[k]!;
    }
    for (let i: number = 0; i < n; ++i) {
      primal +=
        0.5 * problem.diagonal[i]! * x[i]! * x[i]! + problem.linear[i]! * x[i]!;
      dual -= (0.5 * gradient[i]! * gradient[i]!) / problem.diagonal[i]!;
    }
    return (
      primal - dual <=
      Math.sqrt(Number.EPSILON) * Math.max(Math.abs(primal), Math.abs(dual))
    );
  };
  const step = (length: number): void => {
    for (let i: number = 0; i < n; ++i) x[i]! += length * z[i]!;
    for (let i: number = 0; i < u.length; ++i) u[i]! -= length * change[i]!;
  };

  // Equalities: full steps, never dropped; a dependent one is left out and
  // checked at the end.
  const omitted: solveXpbdDualActiveSet.IRow[] = [];
  for (const row of problem.equalities) {
    const a: Float64Array = dense(row);
    const outside: number = direction(a, support(a));
    if (dependent(outside, Math.sqrt(Number.EPSILON))) {
      omitted.push(row);
      continue;
    }
    const length: number = -slack(row) / outside;
    step(length);
    add();
    active.push(-1);
    u.push(length);
    normals.push(a);
    values.push(row.value);
  }
  const equalities: number = active.length;

  const preferred: ReadonlySet<number> = new Set(problem.prefer);
  // Whether each inequality is active.
  const holding: Uint8Array = new Uint8Array(problem.inequalities.length);
  const limit: number =
    10 * (problem.equalities.length + problem.inequalities.length + 1);
  for (let round: number = 0; round < limit; ++round) {
    let pick: number = -1;
    let worst: number = 0;
    let preferredPick: boolean = false;
    problem.inequalities.forEach(
      (row: solveXpbdDualActiveSet.IRow, i: number): void => {
        if (holding[i] === 1) return;
        const value: number = slack(row);
        if (!(value < -rounding(row))) return;
        const norm: number = Math.hypot(...row.weights);
        const measure: number = value / norm;
        const favoured: boolean = preferred.has(i);
        if (
          pick < 0 ||
          (favoured && !preferredPick) ||
          (favoured === preferredPick && measure < worst)
        ) {
          pick = i;
          worst = measure;
          preferredPick = favoured;
        }
      },
    );
    if (pick < 0)
      // The answer is accepted as the optimum only with its certificate, a
      // duality gap within sqrt(eps) of the objective, which rounding on a
      // nearly degenerate active set can lose. A left-out equality holds with the rows it depends on only
      // when they are consistent: its value must vanish to sqrt(eps) of its
      // magnitude, the scale the caller's rows are told independent at.
      return certified() &&
        omitted.every(
          (row: solveXpbdDualActiveSet.IRow): boolean =>
            Math.abs(slack(row)) <=
            Math.sqrt(Number.EPSILON) *
              (rounding(row) / ((row.indices.length + 1) * Number.EPSILON)),
        )
        ? {
            primal: Array.from(x),
            active: active.filter((i: number): boolean => i >= 0),
          }
        : null;
    const row: solveXpbdDualActiveSet.IRow = problem.inequalities[pick]!;
    const a: Float64Array = dense(row);
    const at: number[] = support(a);
    let multiplier: number = 0;
    for (;;) {
      if (++round > limit) return null;
      const outside: number = direction(a, at);
      let partial: number = Infinity;
      let leaving: number = -1;
      for (let k: number = equalities; k < active.length; ++k)
        if (change[k]! > 0 && u[k]! / change[k]! < partial) {
          partial = u[k]! / change[k]!;
          leaving = k;
        }
      const full: number = dependent(outside, n * Number.EPSILON)
        ? Infinity
        : -slack(row) / outside;
      const length: number = Math.min(partial, full);
      if (length === Infinity) return null;
      if (full === Infinity) {
        for (let i: number = 0; i < u.length; ++i) u[i]! -= length * change[i]!;
        multiplier += length;
        drop(leaving);
        continue;
      }
      step(length);
      multiplier += length;
      if (length === full) {
        add();
        active.push(pick);
        holding[pick] = 1;
        u.push(multiplier);
        normals.push(a);
        values.push(row.value);
        break;
      }
      drop(leaving);
    }
  }
  return null;
}

/** The problem and result of solveXpbdDualActiveSet. */
export namespace solveXpbdDualActiveSet {
  /** One row: `a x = value` as an equality, `a x >= value` as an inequality. */
  export interface IRow {
    /** The variables the row reads. */
    indices: number[];

    /** Their coefficients, in `indices`' order. */
    weights: number[];

    /** The row's right side. */
    value: number;
  }

  /** The program. */
  export interface IProblem {
    /** The objective's diagonal, every entry positive. */
    diagonal: number[];

    /** The objective's linear term. */
    linear: number[];

    /** The equality rows. */
    equalities: IRow[];

    /** The inequality rows. */
    inequalities: IRow[];

    /**
     * Indices of inequalities to add first when violated: the previous solve's
     * active set.
     */
    prefer: readonly number[];
  }

  /** A solved program. */
  export interface IResult {
    /** The minimizer. */
    primal: number[];

    /** The inequalities active at it, by index. */
    active: number[];
  }
}
