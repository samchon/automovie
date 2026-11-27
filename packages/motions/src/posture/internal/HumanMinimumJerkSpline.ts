/*
 * The minimum-jerk path through via points at given times (Flash and Hogan
 * 1985, "The coordination of arm movements: an experimentally confirmed
 * mathematical model", J. Neurosci. 5(7):1688-1703): the path minimising the
 * integrated squared jerk through the via points is a quintic on each interval
 * (its Euler-Lagrange equation x⁽⁶⁾ = 0), and at each interior via point its
 * position, velocity, acceleration, jerk and snap are continuous; at the first
 * and the last point it is at rest in velocity and acceleration, the model's
 * boundary conditions.
 *
 * Each interval is the quintic Hermite of its two points' positions, velocities
 * and accelerations; the interior points' velocities and accelerations are the
 * solution of the jerk and snap continuity equations, a block-tridiagonal
 * system of two-by-two blocks solved by block elimination (Golub and Van Loan,
 * "Matrix Computations", section 4.5.1).
 */
export namespace HumanMinimumJerkSpline {
  /*
   * Each via point's velocity and acceleration, per coordinate.
   */
  export interface IDerivatives {
    /*
     * Each point's velocity, coordinate units per second.
     */
    velocities: number[][];

    /*
     * Each point's acceleration, coordinate units per second squared.
     */
    accelerations: number[][];
  }

  /*
   * Each via point's velocity and acceleration on the minimum-jerk path.
   * Parameter times: The points' seconds, strictly ascending.
   * Parameter x: Each point's coordinates.
   * Returns: The velocities and accelerations, zero at both ends.
   */
  export function derivatives(
    times: readonly number[],
    x: readonly (readonly number[])[],
  ): IDerivatives {
    const n: number = times.length;
    const d: number = x[0]?.length ?? 0;
    const velocities: number[][] = times.map((): number[] =>
      new Array<number>(d).fill(0),
    );
    const accelerations: number[][] = times.map((): number[] =>
      new Array<number>(d).fill(0),
    );
    const m: number = n - 2;
    if (m < 1) return { velocities, accelerations };

    // Row i is interior point k = i + 1: its jerk and its snap continuity,
    // A z(k-1) + B z(k) + C z(k+1) = r, z = (velocity, acceleration).
    const A: Block[] = [];
    const B: Block[] = [];
    const C: Block[] = [];
    const r: [number[], number[]][] = [];
    for (let k: number = 1; k <= m; ++k) {
      const hl: number = times[k]! - times[k - 1]!;
      const hr: number = times[k + 1]! - times[k]!;
      A.push([
        [-24 / hl ** 2, -3 / hl],
        [-168 / hl ** 3, -24 / hl ** 2],
      ]);
      B.push([
        [-36 / hl ** 2 + 36 / hr ** 2, 9 / hl + 9 / hr],
        [-192 / hl ** 3 - 192 / hr ** 3, 36 / hl ** 2 - 36 / hr ** 2],
      ]);
      C.push([
        [24 / hr ** 2, -3 / hr],
        [-168 / hr ** 3, 24 / hr ** 2],
      ]);
      const jerk: number[] = [];
      const snap: number[] = [];
      for (let c: number = 0; c < d; ++c) {
        const right: number = x[k + 1]![c]! - x[k]![c]!;
        const left: number = x[k]![c]! - x[k - 1]![c]!;
        jerk.push((60 * right) / hr ** 3 - (60 * left) / hl ** 3);
        snap.push((-360 * right) / hr ** 4 - (360 * left) / hl ** 4);
      }
      r.push([jerk, snap]);
    }

    // Forward elimination: B'(i) = B(i) - A(i) B'(i-1)⁻¹ C(i-1), and the right
    // side alike; the end points' zero velocity and acceleration drop out.
    const pivots: Block[] = [];
    const sides: [number[], number[]][] = [];
    for (let i: number = 0; i < m; ++i) {
      if (i === 0) {
        pivots.push(B[0]!);
        sides.push([[...r[0]![0]], [...r[0]![1]]]);
        continue;
      }
      const factor: Block = multiply(A[i]!, inverse(pivots[i - 1]!));
      pivots.push(subtract(B[i]!, multiply(factor, C[i - 1]!)));
      sides.push([
        r[i]![0].map(
          (v: number, c: number): number =>
            v -
            factor[0][0] * sides[i - 1]![0][c]! -
            factor[0][1] * sides[i - 1]![1][c]!,
        ),
        r[i]![1].map(
          (v: number, c: number): number =>
            v -
            factor[1][0] * sides[i - 1]![0][c]! -
            factor[1][1] * sides[i - 1]![1][c]!,
        ),
      ]);
    }

    // Back substitution: z(i) = B'(i)⁻¹ (r'(i) - C(i) z(i+1)).
    for (let i: number = m - 1; i >= 0; --i) {
      const k: number = i + 1;
      const inv: Block = inverse(pivots[i]!);
      for (let c: number = 0; c < d; ++c) {
        let s0: number = sides[i]![0][c]!;
        let s1: number = sides[i]![1][c]!;
        if (i + 1 < m) {
          const v: number = velocities[k + 1]![c]!;
          const a: number = accelerations[k + 1]![c]!;
          s0 -= C[i]![0][0] * v + C[i]![0][1] * a;
          s1 -= C[i]![1][0] * v + C[i]![1][1] * a;
        }
        velocities[k]![c] = inv[0][0] * s0 + inv[0][1] * s1;
        accelerations[k]![c] = inv[1][0] * s0 + inv[1][1] * s1;
      }
    }
    return { velocities, accelerations };
  }

  /*
   * Each via point's velocity and acceleration on the periodic minimum-jerk
   * path: the same jerk and snap continuity at every point, the last joined to
   * the first across the period, a block-cyclic system solved by Gaussian
   * elimination with partial pivoting (Golub and Van Loan, section 3.4).
   * Parameter times: The points' seconds within one period, strictly ascending.
   * Parameter x: Each point's coordinates.
   * Parameter period: The period, seconds, longer than the points' span.
   * Returns: The velocities and accelerations.
   */
  export function cyclic(
    times: readonly number[],
    x: readonly (readonly number[])[],
    period: number,
  ): IDerivatives {
    const m: number = times.length;
    const d: number = x[0]?.length ?? 0;
    const size: number = 2 * m;
    const span: (k: number) => number = (k: number): number => {
      // The interval from point k to point k + 1, across the period at the end.
      const next: number = k + 1 < m ? times[k + 1]! : times[0]! + period;
      return next - times[k]!;
    };
    const matrix: number[][] = Array.from({ length: size }, (): number[] =>
      new Array<number>(size).fill(0),
    );
    const right: number[][] = Array.from({ length: size }, (): number[] =>
      new Array<number>(d).fill(0),
    );
    for (let k: number = 0; k < m; ++k) {
      const before: number = (k - 1 + m) % m;
      const after: number = (k + 1) % m;
      const hl: number = span(before);
      const hr: number = span(k);
      const add: (row: number, point: number, block: Pair) => void = (
        row: number,
        point: number,
        block: Pair,
      ): void => {
        matrix[row]![2 * point] = matrix[row]![2 * point]! + block[0];
        matrix[row]![2 * point + 1] = matrix[row]![2 * point + 1]! + block[1];
      };
      // Jerk continuity, then snap continuity, as in `derivatives`.
      add(2 * k, before, [-24 / hl ** 2, -3 / hl]);
      add(2 * k, k, [-36 / hl ** 2 + 36 / hr ** 2, 9 / hl + 9 / hr]);
      add(2 * k, after, [24 / hr ** 2, -3 / hr]);
      add(2 * k + 1, before, [-168 / hl ** 3, -24 / hl ** 2]);
      add(2 * k + 1, k, [
        -192 / hl ** 3 - 192 / hr ** 3,
        36 / hl ** 2 - 36 / hr ** 2,
      ]);
      add(2 * k + 1, after, [-168 / hr ** 3, 24 / hr ** 2]);
      for (let c: number = 0; c < d; ++c) {
        const r: number = x[after]![c]! - x[k]![c]!;
        const l: number = x[k]![c]! - x[before]![c]!;
        right[2 * k]![c] = (60 * r) / hr ** 3 - (60 * l) / hl ** 3;
        right[2 * k + 1]![c] = (-360 * r) / hr ** 4 - (360 * l) / hl ** 4;
      }
    }

    // Gaussian elimination with partial pivoting, every coordinate at once.
    for (let col: number = 0; col < size; ++col) {
      let pivot: number = col;
      for (let row: number = col + 1; row < size; ++row)
        if (Math.abs(matrix[row]![col]!) > Math.abs(matrix[pivot]![col]!))
          pivot = row;
      [matrix[col], matrix[pivot]] = [matrix[pivot]!, matrix[col]!];
      [right[col], right[pivot]] = [right[pivot]!, right[col]!];
      for (let row: number = col + 1; row < size; ++row) {
        const factor: number = matrix[row]![col]! / matrix[col]![col]!;
        if (factor === 0) continue;
        for (let k: number = col; k < size; ++k)
          matrix[row]![k] = matrix[row]![k]! - factor * matrix[col]![k]!;
        for (let c: number = 0; c < d; ++c)
          right[row]![c] = right[row]![c]! - factor * right[col]![c]!;
      }
    }
    const z: number[][] = right.map((row: number[]): number[] => [...row]);
    for (let row: number = size - 1; row >= 0; --row)
      for (let c: number = 0; c < d; ++c) {
        let s: number = z[row]![c]!;
        for (let k: number = row + 1; k < size; ++k)
          s -= matrix[row]![k]! * z[k]![c]!;
        z[row]![c] = s / matrix[row]![row]!;
      }
    return {
      velocities: times.map((_: number, k: number): number[] => z[2 * k]!),
      accelerations: times.map(
        (_: number, k: number): number[] => z[2 * k + 1]!,
      ),
    };
  }

  /*
   * The quintic Hermite between two via points at a share of their interval.
   * Parameter p0: The first point.
   * Parameter p1: The second point.
   * Parameter v0: The first point's velocity.
   * Parameter v1: The second point's velocity.
   * Parameter a0: The first point's acceleration.
   * Parameter a1: The second point's acceleration.
   * Parameter h: The interval, seconds.
   * Parameter u: The share of the interval, 0 to 1.
   * Returns: The coordinates there.
   */
  export function quintic(
    p0: readonly number[],
    p1: readonly number[],
    v0: readonly number[],
    v1: readonly number[],
    a0: readonly number[],
    a1: readonly number[],
    h: number,
    u: number,
  ): number[] {
    const u2: number = u * u;
    const u3: number = u2 * u;
    const u4: number = u3 * u;
    const u5: number = u4 * u;
    const h0: number = 1 - 10 * u3 + 15 * u4 - 6 * u5;
    const h1: number = u - 6 * u3 + 8 * u4 - 3 * u5;
    const h2: number = 0.5 * u2 - 1.5 * u3 + 1.5 * u4 - 0.5 * u5;
    const h3: number = 0.5 * u3 - u4 + 0.5 * u5;
    const h4: number = -4 * u3 + 7 * u4 - 3 * u5;
    const h5: number = 10 * u3 - 15 * u4 + 6 * u5;
    return p0.map(
      (v: number, c: number): number =>
        h0 * v +
        h1 * h * v0[c]! +
        h2 * h * h * a0[c]! +
        h3 * h * h * a1[c]! +
        h4 * h * v1[c]! +
        h5 * p1[c]!,
    );
  }
}

/*
 * A pair of numbers: one block row.
 */
type Pair = [number, number];

/*
 * A two-by-two matrix, rows first.
 */
type Block = [[number, number], [number, number]];

/*
 * The product of two blocks.
 */
function multiply(a: Block, b: Block): Block {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1],
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1],
    ],
  ];
}

/*
 * The difference of two blocks.
 */
function subtract(a: Block, b: Block): Block {
  return [
    [a[0][0] - b[0][0], a[0][1] - b[0][1]],
    [a[1][0] - b[1][0], a[1][1] - b[1][1]],
  ];
}

/*
 * A block's inverse.
 */
function inverse(a: Block): Block {
  const det: number = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  return [
    [a[1][1] / det, -a[0][1] / det],
    [-a[1][0] / det, a[0][0] / det],
  ];
}
