import { HumanPopulationSurvey } from "./HumanPopulationSurvey";

/**
 * Conditioning under a sex's multivariate normal: the regression form of a
 * boundary manikin (Young et al. 2008, NASA 20080013454), which sets a few
 * measures and lets every other take its expected value, so a person stays
 * inside the survey's joint distribution and its tapes move together as a
 * real body's do.
 */
export namespace HumanPopulationConditional {
  /** A conditional mean and standard deviation. */
  export interface IMoments {
    /** Conditional mean. */
    mean: number;

    /** Conditional standard deviation. */
    sd: number;
  }

  /**
   * Index of a measure in the survey vectors.
   *
   * @param v The measure.
   * @returns Its index.
   */
  export function index(v: HumanPopulationSurvey.Variable): number {
    return HumanPopulationSurvey.VARIABLES.indexOf(v);
  }

  /**
   * Conditional mean and standard deviation of one measure given known values
   * of others, `mu_t + S_tk S_kk^-1 (v_k - mu_k)` and its residual variance.
   *
   * @param sex The surveyed sex.
   * @param known Known values by measure index.
   * @param target Index of the measure sought.
   * @returns Its moments given the known values.
   */
  export function moments(sex: HumanPopulationSurvey.Sex, known: ReadonlyMap<number, number>, target: number): IMoments {
    const t: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY[sex];
    const keys: number[] = [...known.keys()];
    const A: number[][] = keys.map((i: number): number[] => keys.map((j: number): number => covariance(sex, i, j)));
    const c: number[] = keys.map((i: number): number => covariance(sex, target, i));
    const w: number[] = solve(A, keys.map((i: number): number => known.get(i)! - t.mean[i]!));
    const g: number[] = solve(A, c);
    const mean: number = t.mean[target]! + c.reduce((s: number, x: number, k: number): number => s + x * w[k]!, 0);
    const variance: number = covariance(sex, target, target) - c.reduce((s: number, x: number, k: number): number => s + x * g[k]!, 0);

    return { mean, sd: Math.sqrt(Math.max(variance, 0)) };
  }

  /**
   * Covariance of two measures from the survey's SDs and correlations.
   *
   * @param sex The surveyed sex.
   * @param i Index of one measure.
   * @param j Index of the other.
   * @returns Their covariance.
   */
  function covariance(sex: HumanPopulationSurvey.Sex, i: number, j: number): number {
    const t: HumanPopulationSurvey.ISurvey = HumanPopulationSurvey.SURVEY[sex];
    const r: number = i === j ? 1 : i > j ? t.r[i - 1]![j]! : t.r[j - 1]![i]!;

    return r * t.sd[i]! * t.sd[j]!;
  }

  /**
   * Solve `A x = b` by Gaussian elimination with partial pivoting.
   *
   * @param A Square matrix; may be empty.
   * @param b Right-hand side.
   * @returns The solution.
   */
  function solve(A: number[][], b: number[]): number[] {
    const n: number = b.length;
    const M: number[][] = A.map((row: number[], i: number): number[] => [...row, b[i]!]);

    for (let k: number = 0; k < n; k++) {
      let p: number = k;
      for (let i: number = k + 1; i < n; i++) if (Math.abs(M[i]![k]!) > Math.abs(M[p]![k]!)) p = i;
      [M[k], M[p]] = [M[p]!, M[k]!];
      const pivot: number[] = M[k]!;
      for (let i: number = k + 1; i < n; i++) {
        const row: number[] = M[i]!;
        const f: number = row[k]! / pivot[k]!;
        for (let j: number = k; j <= n; j++) row[j] = row[j]! - f * pivot[j]!;
      }
    }

    const x: number[] = new Array<number>(n).fill(0);
    for (let i: number = n - 1; i >= 0; i--) {
      let s: number = M[i]![n]!;
      for (let j: number = i + 1; j < n; j++) s -= M[i]![j]! * x[j]!;
      x[i] = s / M[i]![i]!;
    }

    return x;
  }
}
