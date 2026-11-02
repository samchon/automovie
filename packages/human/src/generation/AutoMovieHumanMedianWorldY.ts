/** Exact median evaluation without an unnecessary inverse of lateral angle. */
export namespace AutoMovieHumanMedianWorldY {
  /** Physical body-space point in the caller's unchanged coordinate units. */
  export type Point = [number, number, number];

  /** Original world-Y iteration with the analytical median angle held at zero. */
  export interface IReading {
    /** Last actual median point, including caller-owned tilt and neck boundary. */
    point: Point;
    /** Section station that produced the observed point. */
    station: number;
    /** Actual world-Y residual, in the caller's physical coordinate units. */
    residual: number;
    /** Number of actual median point evaluations, bounded by twelve. */
    evaluations: number;
    /** Whether the unchanged 1e-6 world-Y stopping criterion was reached. */
    converged: boolean;
  }

  /**
   * Retain the current twelve bounded station corrections and exact stopping
   * criterion. Symmetric raw radius plus a declared signed boundary maps the
   * true median to angle zero, so its twenty-eight-step angular inverse has
   * no unknown left to solve. The callback still owns every tilt, relief and
   * neck-boundary term; no simplified skull substitutes for actual geometry.
   */
  export function solve(y: number, point: (station: number) => Point): IReading {
    let station: number = y;
    let out!: Point;
    let evaluatedStation: number = station;
    let evaluations: number = 0;
    for (let iteration: number = 0; iteration < 12; iteration++) {
      evaluatedStation = station;
      out = point(station);
      evaluations++;
      const error: number = out[1] - y;
      if (Math.abs(error) < 1e-6) break;
      station -= error;
    }
    const residual: number = out[1] - y;
    return { point: out, station: evaluatedStation, residual, evaluations, converged: Math.abs(residual) < 1e-6 };
  }
}
