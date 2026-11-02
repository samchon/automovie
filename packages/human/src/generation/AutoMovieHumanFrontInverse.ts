/** Checked acceleration of the existing ordered front-half inverse. */
export namespace AutoMovieHumanFrontInverse {
  /** Actual world point, in the source's unchanged physical units. */
  export type Point = [number, number, number];

  /** Inverse result, with an explicit source-compatible fallback route. */
  export interface IReading {
    /** Actual callback point; no simplified surface supplies this value. */
    point: Point;
    /** Evaluated source station. */
    station: number;
    /** Evaluated front-half angle. */
    theta: number;
    /** Original twenty-eight-step dyadic angular cell. */
    bracket: [number, number];
    /** Whether the fast route passed every original stopping condition. */
    accelerated: boolean;
    /** Observed reason for using the unchanged original route. */
    reason?: string;
    /** Actual source evaluations spent on the attempted fast route. */
    fastEvaluations: number;
    /** Actual source evaluations spent on the original route. */
    legacyEvaluations: number;
  }

  /** One observed angular value used only inside the current solve. */
  interface ISample {
    /** Actual front-half angle. */
    theta: number;
    /** Observed absolute lateral coordinate minus the requested magnitude. */
    value: number;
  }

  /** Dyadic division count is exactly the original twenty-eight binary steps. */
  const DIVISIONS: number = 2 ** 28;
  /** Unchanged original front-half interval. */
  const END: number = Math.PI / 2;
  /** Width of one original terminal binary cell. */
  const CELL: number = END / DIVISIONS;

  /** Run the original bounded source, including its existing failure meaning. */
  function legacy(y: number, z: number, point: (station: number, theta: number) => Point, reason: string, fastEvaluations: number): IReading {
    let station: number = y;
    let evaluated: number = station;
    let out: Point = point(station, 0);
    let calls: number = 1;
    let lo: number = 0;
    let hi: number = END;
    let theta: number = 0;
    for (let iteration: number = 0; iteration < 12; iteration++) {
      lo = 0; hi = END;
      for (let i: number = 0; i < 28; i++) {
        const middle: number = (lo + hi) / 2;
        const p: Point = point(station, middle); calls++;
        if (Math.abs(p[2]) < Math.abs(z)) lo = middle;
        else hi = middle;
      }
      theta = (lo + hi) / 2;
      evaluated = station;
      out = point(station, theta); calls++;
      const error: number = out[1] - y;
      if (Math.abs(error) < 1e-6) break;
      station -= error;
    }
    return { point: out, station: evaluated, theta, bracket: [lo, hi], accelerated: false, reason, fastEvaluations, legacyEvaluations: calls };
  }

  /**
   * Preserve the source's twelve world-Y corrections. Secant predictions only
   * locate a candidate original dyadic cell; actual callback values must prove
   * lower Z < target <= upper Z before its midpoint is used. This is equivalent
   * to the old binary branch under the same ordered-front-half contract.
   * Observed reversals, invalid samples, unproved cells and exhausted bounded
   * work use the original implementation. Finite samples cannot prove global
   * monotonicity: ordered=false explicitly retains the old route for an owner
   * that cannot assert the contract. Exact median remains the caller's owner.
   */
  export function solve(y: number, z: number, point: (station: number, theta: number) => Point, ordered: boolean = true): IReading {
    let calls: number = 0;
    if (z === 0 || !Number.isFinite(y) || !Number.isFinite(z) || !ordered)
      return legacy(y, z, point, z === 0 ? "median-owned" : !ordered ? "unproved-angular-order" : "invalid-target", calls);
    const target: number = Math.abs(z);
    let station: number = y;
    let seed: number | undefined;
    try {
      for (let outer: number = 0; outer < 12; outer++) {
        const seen: ISample[] = [];
        /** Observe actual geometry and retain all witnessed ordering violations. */
        const sample: (theta: number) => ISample = (theta: number): ISample => {
          if (calls >= 96) throw new Error("fast-evaluation-budget");
          const p: Point = point(station, theta); calls++;
          if (!p.every(Number.isFinite)) throw new Error("nonfinite-observation");
          const at: ISample = { theta, value: Math.abs(p[2]) - target };
          if (seen.some((other: ISample): boolean => other.theta < theta ? other.value > at.value : other.theta > theta && other.value < at.value))
            throw new Error("observed-angular-reversal");
          seen.push(at);
          return at;
        };
        const a: ISample = sample(0);
        const b: ISample = sample(END);
        if (!(a.value < 0 && b.value >= 0)) throw new Error("unbracketed-lateral-target");
        let lo: number = 0;
        let hi: number = END;
        let latest: ISample = b;
        let theta: number = seed ?? END * (-a.value) / (b.value - a.value);
        let certified: [number, number] | undefined;
        for (let iteration: number = 0; iteration < 16; iteration++) {
          if (!(theta > lo && theta < hi)) theta = (lo + hi) / 2;
          const at: ISample = sample(theta);
          if (at.value < 0) lo = theta; else hi = theta;
          if (at.value === 0 || Math.abs(at.theta - latest.theta) <= CELL || hi - lo <= CELL) {
            let index: number = Math.max(0, Math.min(DIVISIONS - 1, Math.floor(theta / CELL)));
            let left: ISample = sample(index * CELL);
            let right: ISample = sample((index + 1) * CELL);
            if (left.value >= 0 && index > 0) { right = left; index--; left = sample(index * CELL); }
            else if (right.value < 0 && index + 1 < DIVISIONS) { left = right; index++; right = sample((index + 1) * CELL); }
            if (left.value < 0 && right.value >= 0) { certified = [left.theta, right.theta]; break; }
          }
          const proposed: number = at.theta - at.value * (at.theta - latest.theta) / (at.value - latest.value);
          latest = at;
          theta = proposed;
        }
        if (certified === undefined) throw new Error("unproved-original-angular-cell");
        theta = (certified[0] + certified[1]) / 2;
        if (calls >= 96) throw new Error("fast-evaluation-budget");
        const out: Point = point(station, theta); calls++;
        if (!out.every(Number.isFinite)) throw new Error("nonfinite-final-point");
        const error: number = out[1] - y;
        if (Math.abs(error) < 1e-6) return { point: out, station, theta, bracket: certified, accelerated: true, fastEvaluations: calls, legacyEvaluations: 0 };
        station -= error;
        seed = theta;
      }
      return legacy(y, z, point, "world-y-not-converged", calls);
    } catch (error) {
      return legacy(y, z, point, error instanceof Error ? error.message : "invalid-fast-observation", calls);
    }
  }
}
