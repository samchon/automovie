import { AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";

/**
 * A relief net re-represented on a coarser grid of its own window (issue #3197, stage B2): the least-squares projection of the stored
 * net's surface onto the coarser spline space, and the difference of the two surfaces. A bounded re-representation of stored numbers:
 * nothing here reads a reference or fits a skin.
 *
 * The engine's net is a uniform cubic B-spline over its window (`AutoMovieLoftRelief.height`): control `i` of `n` stands at parameter
 * `i - 1` of `[0, n - 3]`, its Greville abscissa, so a grid of other counts on the same window has its controls at their own Greville
 * abscissae by construction. The three outer rings of a projected net are held at exactly zero, so the height and its first two
 * derivatives still vanish at the window's edge and the window still contains its height. The surfaces are read by the engine's own
 * evaluator.
 */
export namespace FamilyConicProject {
  /** What a difference of two nets' surfaces on one window comes to. */
  export interface IDifference {
    /** Largest difference of heights, mm along the cast. */
    max: number;

    /** Its 99th percentile over the samples, mm. */
    p99: number;

    /** Its root mean square over the samples, mm. */
    rms: number;

    /** Largest slope of the difference, degrees, by central differences on the sample grid; 0 without a radius. */
    slope: number;

    /** Station, mm, and phase, radians, of the largest difference. */
    at: [number, number];
  }

  /** The four weights of a uniform cubic span and its first control, as the engine's own basis gives them. */
  function basis(x: number, count: number): [number, number[]] {
    const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
    const f: number = x - i;
    return [i, [(1 - f) ** 3 / 6, (3 * f ** 3 - 6 * f ** 2 + 4) / 6, (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6, f ** 3 / 6]];
  }

  /** The weights of `count` controls at `samples` evenly spaced parameters over the whole window, row by sample. */
  function design(samples: number, count: number): number[][] {
    return Array.from({ length: samples }, (_: unknown, k: number): number[] => {
      const out: number[] = new Array<number>(count).fill(0);
      const [i, w]: [number, number[]] = basis((k / (samples - 1)) * (count - 3), count);
      for (let c: number = 0; c < 4; ++c) out[i + c]! += w[c]!;
      return out;
    });
  }

  /** Solve `G X = B` for a symmetric positive definite `G` by Cholesky, `B` given and returned by rows. */
  function solve(G: number[][], B: number[][]): number[][] {
    const n: number = G.length;
    const L: number[][] = G.map((r: number[]): number[] => [...r]);
    for (let j: number = 0; j < n; ++j) {
      for (let k: number = 0; k < j; ++k) for (let i: number = j; i < n; ++i) L[i]![j]! -= L[i]![k]! * L[j]![k]!;
      const d: number = Math.sqrt(L[j]![j]!);
      for (let i: number = j; i < n; ++i) L[i]![j]! /= d;
    }
    const X: number[][] = B.map((r: number[]): number[] => [...r]);
    for (let c: number = 0; c < (B[0]?.length ?? 0); ++c) {
      for (let i: number = 0; i < n; ++i) {
        for (let k: number = 0; k < i; ++k) X[i]![c]! -= L[i]![k]! * X[k]![c]!;
        X[i]![c]! /= L[i]![i]!;
      }
      for (let i: number = n - 1; i >= 0; --i) {
        for (let k: number = i + 1; k < n; ++k) X[i]![c]! -= L[k]![i]! * X[k]![c]!;
        X[i]![c]! /= L[i]![i]!;
      }
    }
    return X;
  }

  /** A net's surface at `ns` by `nt` evenly spaced stations and phases over its whole window, through the engine's evaluator. */
  export function surface(relief: IAutoMovieLoftRelief, ns: number, nt: number): number[][] {
    const span: number = AutoMovieLoftRelief.width(relief);
    return Array.from({ length: ns }, (_: unknown, i: number): number[] =>
      Array.from({ length: nt }, (__: unknown, j: number): number => AutoMovieLoftRelief.height(relief, relief.stations[0] + ((relief.stations[1] - relief.stations[0]) * i) / (ns - 1), relief.phases[0] + (span * j) / (nt - 1))[0]),
    );
  }

  /** Whether a net equals its own column reversal exactly. */
  export function symmetric(relief: IAutoMovieLoftRelief): boolean {
    return relief.heights.every((h: number, i: number): boolean => h === relief.heights[i - (i % relief.columns) + (relief.columns - 1 - (i % relief.columns))]);
  }

  /** A number rounded to `decimals` places, as a module stores it; a negative zero is written as zero. */
  export function rounded(x: number, decimals: number): number {
    return Math.round(x * 10 ** decimals) / 10 ** decimals || 0;
  }

  /**
   * The net made its own mirror image: every control the mean of itself and the control its column reversal sends it to, rounded to
   * `decimals` places. Both controls of a pair take the one rounded number, so the result equals its reversal exactly.
   */
  export function symmetrised(relief: IAutoMovieLoftRelief, decimals: number): IAutoMovieLoftRelief {
    return { ...relief, heights: relief.heights.map((h: number, i: number): number => rounded((h + relief.heights[i - (i % relief.columns) + (relief.columns - 1 - (i % relief.columns))]!) / 2, decimals)) };
  }

  /**
   * The least-squares projection of a net's surface onto a grid of `rows` by `columns` controls on the same window.
   *
   * The surface is sampled `perSpan` times a stored control spacing each way, and the coarse controls inside the three zero rings are
   * the least-squares solution on those samples, solved one direction at a time (on a grid of samples a tensor-product fit separates:
   * `C = (A^T A)^-1 A^T F B (B^T B)^-1`). With `symmetric`, the unknowns are the columns up to the middle one and each stands for itself
   * and its mirror column, so the constraint is in the solve and the result equals its column reversal to the last bit. Every control
   * is rounded to `decimals` places, as a module stores it.
   *
   * @param relief The stored net.
   * @param rows Coarse rows, at least 7.
   * @param columns Coarse columns, at least 7; odd with `symmetric`.
   * @param symmetric Hold the net to its own mirror image.
   * @param decimals Decimal places of a stored height.
   * @param perSpan Samples per stored control spacing.
   */
  export function project(relief: IAutoMovieLoftRelief, rows: number, columns: number, symmetric: boolean, decimals: number, perSpan: number): IAutoMovieLoftRelief {
    if (rows < 7 || columns < 7) throw new Error("project: a net has at least 7 rows and 7 columns, not " + rows + " by " + columns);
    if (symmetric && columns % 2 !== 1) throw new Error("project: a mirrored net of " + columns + " columns has no middle column");
    if (relief.shift !== undefined) throw new Error("project: " + relief.name + " carries a station map");
    const F: number[][] = surface(relief, perSpan * (relief.rows - 3) + 1, perSpan * (relief.columns - 3) + 1);
    const freeRows: number[] = Array.from({ length: rows - 6 }, (_: unknown, k: number): number => k + 3);
    // With symmetry, the free columns up to the middle; each but the middle also weighs its mirror column.
    const middle: number = (columns - 1) / 2;
    const freeColumns: number[] = Array.from({ length: columns - 6 }, (_: unknown, k: number): number => k + 3).filter((b: number): boolean => !symmetric || b <= middle);
    const A: number[][] = design(F.length, rows).map((r: number[]): number[] => freeRows.map((a: number): number => r[a]!));
    const B: number[][] = design(F[0]!.length, columns).map((r: number[]): number[] => freeColumns.map((b: number): number => r[b]! + (symmetric && b < middle ? r[columns - 1 - b]! : 0)));
    const gram = (M: number[][]): number[][] => M[0]!.map((_: number, p: number): number[] => M[0]!.map((__: number, q: number): number => M.reduce((sum: number, r: number[]): number => sum + r[p]! * r[q]!, 0)));
    const AtF: number[][] = freeRows.map((_: number, p: number): number[] => F[0]!.map((__: number, j: number): number => A.reduce((sum: number, r: number[], i: number): number => sum + r[p]! * F[i]![j]!, 0)));
    const X: number[][] = solve(gram(A), AtF);
    const XB: number[][] = X.map((r: number[]): number[] => freeColumns.map((_: number, q: number): number => r.reduce((sum: number, x: number, j: number): number => sum + x * B[j]![q]!, 0)));
    const Yt: number[][] = solve(gram(B), freeColumns.map((_: number, q: number): number[] => XB.map((r: number[]): number => r[q]!)));
    const heights: number[] = new Array<number>(rows * columns).fill(0);
    freeRows.forEach((a: number, p: number): void =>
      freeColumns.forEach((b: number, q: number): void => {
        const h: number = rounded(Yt[q]![p]!, decimals);
        heights[a * columns + b] = h;
        if (symmetric) heights[a * columns + (columns - 1 - b)] = h;
      }),
    );
    return { ...relief, rows, columns, heights };
  }

  /**
   * The difference of another net's surface from a net's on the same window, sampled `perSpan` times a control spacing of the finer of
   * the two each way.
   *
   * @param relief The net the difference is taken from.
   * @param other The other net, on the same window.
   * @param perSpan Samples per control spacing.
   * @param radius The wall's radius at a station and a phase, mm, which turns a phase step into millimetres for the slope; absent, no slope.
   */
  export function difference(relief: IAutoMovieLoftRelief, other: IAutoMovieLoftRelief, perSpan: number, radius?: (station: number, phase: number) => number): IDifference {
    const [ns, nt]: [number, number] = [perSpan * (Math.max(relief.rows, other.rows) - 3) + 1, perSpan * (Math.max(relief.columns, other.columns) - 3) + 1];
    const [F, G]: number[][][] = [surface(relief, ns, nt), surface(other, ns, nt)];
    const D: number[][] = G!.map((r: number[], i: number): number[] => r.map((x: number, j: number): number => x - F![i]![j]!));
    const [ds, dt]: [number, number] = [(relief.stations[1] - relief.stations[0]) / (ns - 1), AutoMovieLoftRelief.width(relief) / (nt - 1)];
    const flat: number[] = D.flat().map(Math.abs).sort((x: number, y: number): number => x - y);
    let at: [number, number] = [0, 0];
    for (let i: number = 0; i < ns; ++i) for (let j: number = 0; j < nt; ++j) if (Math.abs(D[i]![j]!) > Math.abs(D[at[0]]![at[1]]!)) at = [i, j];
    let slope: number = 0;
    if (radius !== undefined)
      for (let i: number = 1; i < ns - 1; ++i)
        for (let j: number = 1; j < nt - 1; ++j) slope = Math.max(slope, Math.hypot((D[i + 1]![j]! - D[i - 1]![j]!) / (2 * ds), (D[i]![j + 1]! - D[i]![j - 1]!) / (2 * dt * Math.max(1, radius(relief.stations[0] + i * ds, relief.phases[0] + j * dt)))));
    return { max: flat.at(-1)!, p99: flat[Math.min(flat.length - 1, Math.floor(0.99 * flat.length))]!, rms: Math.sqrt(flat.reduce((sum: number, x: number): number => sum + x * x, 0) / flat.length), slope: (Math.atan(slope) * 180) / Math.PI, at: [relief.stations[0] + at[0] * ds, relief.phases[0] + at[1] * dt] };
  }
}
