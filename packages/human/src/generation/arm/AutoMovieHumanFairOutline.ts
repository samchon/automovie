/**
 * The fairest C2 scalar outline through declared constraints: the chain of
 * quintic Hermite spans in a source parameter `q` that minimises the bending
 * energy `E = integral of (d2y/dq2)^2 dq` subject to the values, slopes and
 * second derivatives the caller fixes at its knots. Every value, slope and
 * second derivative the caller leaves free is chosen by that minimum.
 *
 * Basis: among all twice continuously differentiable interpolants of given
 * values, the natural cubic spline uniquely minimises this energy (Holladay's
 * theorem; de Boor, A Practical Guide to Splines, 2001, ch. V, "Smoothest
 * interpolation property"). Cubics are quintics, so with values alone this
 * chain is exactly that natural cubic spline in `q`, the engine's default
 * outline (`AutoMovieViewOutline`); fixed zero slopes add the extremum
 * stations an anatomical belly declares, and the minimum then supplies the
 * belly's height instead of an invented amplitude. The energy is measured in
 * the caller's source parameter, which for a lofted outline is the engine's
 * own (station, or its root/angle pole parameter), so the stored jets are the
 * ones the engine's `AutoMovieViewHermite` evaluates.
 *
 * Method: each span `[q_i, q_{i+1}]`, `h = q_{i+1} - q_i`, is the quintic
 * Hermite polynomial of its end jets; its energy is `a^T G a / h^3` with
 * `a = [y0, h m0, h^2 c0, y1, h m1, h^2 c1]` and `G` the Gram matrix of the
 * basis second derivatives on [0, 1], integrated exactly by four-point
 * Gauss-Legendre quadrature (degree 7 >= 6). Shared knot jets make the chain C2.
 * The free variables solve the normal equations by Gaussian elimination with
 * partial pivoting. Premise: at least two distinct knots fix their values, so
 * no linear function lies in the free null space; otherwise the solve throws.
 */
export namespace AutoMovieHumanFairOutline {
  /** One knot's constraint; null leaves that quantity to the minimum. */
  export interface IKnot {
    /** Source parameter value, strictly increasing over the knots. */
    q: number;

    /** Fixed value, or null. */
    value: number | null;

    /** Fixed dy/dq, or null. */
    slope: number | null;

    /**
     * Fixed d2y/dq2 in the knot's own source parameter (value units per unit
     * of `q` squared), such as zero at a declared inflection; absent or null
     * leaves it to the minimum, the behaviour without this field.
     */
    second?: number | null;
  }

  /** One knot's jet in the source parameter. */
  export interface IJet {
    /** y. */
    value: number;

    /** dy/dq. */
    first: number;

    /** d2y/dq2. */
    second: number;
  }

  /** Solve the minimum-energy chain; returns one jet per knot. */
  export function solve(knots: readonly IKnot[]): IJet[] {
    const n: number = knots.length;
    if (n < 2) throw new Error("A fair outline needs two knots");
    for (let i: number = 1; i < n; ++i)
      if (!(knots[i]!.q > knots[i - 1]!.q)) throw new Error("Fair outline knots must increase in q");

    // Energy matrix over x = (y_i, m_i, c_i) per knot.
    const size: number = 3 * n;
    const Q: number[][] = Array.from({ length: size }, (): number[] => new Array<number>(size).fill(0));
    for (let i: number = 0; i + 1 < n; ++i) {
      const h: number = knots[i + 1]!.q - knots[i]!.q;
      const index: number[] = [3 * i, 3 * i + 1, 3 * i + 2, 3 * i + 3, 3 * i + 4, 3 * i + 5];
      const s: number[] = [1, h, h * h, 1, h, h * h];
      for (let j: number = 0; j < 6; ++j)
        for (let k: number = 0; k < 6; ++k) {
          const row: number[] = Q[index[j]!]!;
          row[index[k]!] = row[index[k]!]! + (s[j]! * s[k]! * GRAM[j]![k]!) / (h * h * h);
        }
    }

    // Fixed and free variables.
    const fixed: (number | null)[] = knots.flatMap((k: IKnot): (number | null)[] => [k.value, k.slope, k.second ?? null]);
    const free: number[] = fixed.map((v: number | null, i: number): number => (v === null ? i : -1)).filter((i: number): boolean => i >= 0);
    if (knots.filter((k: IKnot): boolean => k.value !== null).length < 2)
      throw new Error("A fair outline needs two fixed values to remove the linear null space");
    const A: number[][] = free.map((r: number): number[] => free.map((c: number): number => Q[r]![c]!));
    const b: number[] = free.map((r: number): number =>
      -fixed.reduce((sum: number, v: number | null, c: number): number => (v === null ? sum : sum + Q[r]![c]! * v), 0),
    );
    const x: number[] = gauss(A, b);
    const all: number[] = fixed.map((v: number | null): number => v ?? 0);
    free.forEach((index: number, k: number): void => {
      all[index] = x[k]!;
    });
    return knots.map((_: IKnot, i: number): IJet => ({ value: all[3 * i]!, first: all[3 * i + 1]!, second: all[3 * i + 2]! }));
  }

  /**
   * Value and the first two derivatives in `q` of the chain at `x`, clamped
   * to the knot range.
   */
  export function evaluate(q: readonly number[], jets: readonly IJet[], x: number): [number, number, number] {
    let i: number = 0;
    while (i < q.length - 2 && x > q[i + 1]!) ++i;
    const h: number = q[i + 1]! - q[i]!;
    const t: number = Math.min(1, Math.max(0, (x - q[i]!) / h));
    const a: IJet = jets[i]!;
    const b: IJet = jets[i + 1]!;
    const c: number[] = [a.value, h * a.first, h * h * a.second, b.value, h * b.first, h * h * b.second];
    let y: number = 0;
    let dy: number = 0;
    let ddy: number = 0;
    for (let j: number = 0; j < 6; ++j) {
      y += c[j]! * basis(j, t, 0);
      dy += c[j]! * basis(j, t, 1);
      ddy += c[j]! * basis(j, t, 2);
    }
    return [y, dy / h, ddy / (h * h)];
  }

  /** The bending energy of a chain, by the same exact quadrature. */
  export function energy(q: readonly number[], jets: readonly IJet[]): number {
    let e: number = 0;
    for (let i: number = 0; i + 1 < q.length; ++i) {
      const h: number = q[i + 1]! - q[i]!;
      const a: number[] = [jets[i]!.value, h * jets[i]!.first, h * h * jets[i]!.second, jets[i + 1]!.value, h * jets[i + 1]!.first, h * h * jets[i + 1]!.second];
      for (let j: number = 0; j < 6; ++j) for (let k: number = 0; k < 6; ++k) e += (a[j]! * a[k]! * GRAM[j]![k]!) / (h * h * h);
    }
    return e;
  }

  /**
   * Quintic Hermite basis on [0, 1] and its derivatives: value at 0, first
   * and second derivative at 0, then the same at 1 (each basis function owns
   * one of the six end conditions).
   */
  export function basis(j: number, t: number, order: 0 | 1 | 2): number {
    const p: readonly number[] = BASIS[j]!;
    let v: number = 0;
    for (let k: number = order; k < p.length; ++k) {
      const factor: number = order === 0 ? 1 : order === 1 ? k : k * (k - 1);
      v += factor * p[k]! * Math.pow(t, k - order);
    }
    return v;
  }

  /** Power coefficients (t^0 .. t^5) of the six quintic Hermite basis functions. */
  const BASIS: readonly (readonly number[])[] = [
    [1, 0, 0, -10, 15, -6],
    [0, 1, 0, -6, 8, -3],
    [0, 0, 0.5, -1.5, 1.5, -0.5],
    [0, 0, 0, 10, -15, 6],
    [0, 0, 0, -4, 7, -3],
    [0, 0, 0, 0.5, -1, 0.5],
  ];

  /** Gram matrix of the basis second derivatives on [0, 1], four-point Gauss-Legendre (exact for degree 6). */
  const GRAM: readonly (readonly number[])[] = ((): number[][] => {
    const nodes: number[] = [-0.8611363115940526, -0.3399810435848563, 0.3399810435848563, 0.8611363115940526];
    const weights: number[] = [0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538];
    return Array.from({ length: 6 }, (_: unknown, j: number): number[] =>
      Array.from({ length: 6 }, (__: unknown, k: number): number =>
        nodes.reduce((sum: number, x: number, g: number): number => {
          const t: number = (x + 1) / 2;
          return sum + (weights[g]! / 2) * basis(j, t, 2) * basis(k, t, 2);
        }, 0),
      ),
    );
  })();

  /** Gaussian elimination with partial pivoting; throws on a singular system. */
  function gauss(A: number[][], b: number[]): number[] {
    const n: number = b.length;
    const M: number[][] = A.map((row: number[], i: number): number[] => [...row, b[i]!]);
    for (let col: number = 0; col < n; ++col) {
      let pivot: number = col;
      for (let r: number = col + 1; r < n; ++r) if (Math.abs(M[r]![col]!) > Math.abs(M[pivot]![col]!)) pivot = r;
      if (!(Math.abs(M[pivot]![col]!) > 1e-300)) throw new Error("Fair outline system is singular");
      [M[col], M[pivot]] = [M[pivot]!, M[col]!];
      for (let r: number = col + 1; r < n; ++r) {
        const f: number = M[r]![col]! / M[col]![col]!;
        const row: number[] = M[r]!;
        for (let c: number = col; c <= n; ++c) row[c] = row[c]! - f * M[col]![c]!;
      }
    }
    const x: number[] = new Array<number>(n).fill(0);
    for (let r: number = n - 1; r >= 0; --r) {
      let s: number = M[r]![n]!;
      for (let c: number = r + 1; c < n; ++c) s -= M[r]![c]! * x[c]!;
      x[r] = s / M[r]![r]!;
    }
    return x;
  }
}
