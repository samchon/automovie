/** Two independent positive surface dimensions closed in positive log scales. */
export namespace AutoMovieHumanPositivePairSolve {
  /** Ordered dimensions or their positive construction controls. */
  export type Pair = readonly [number, number];

  /**
   * Damped Newton solve whose observer reads the composed surface. Relative
   * residuals give each dimension equal authority; log coordinates keep every
   * trial positive. Both relative residuals must fall below 1e-8.
   */
  export function solve(wanted: Pair, initial: Pair, observe: (controls: Pair) => Pair): Pair {
    if (![...wanted, ...initial].every((value: number): boolean => Number.isFinite(value) && value > 0))
      throw new Error("Surface dimensions and controls must be finite and positive");

    /** Read both dimensions afresh, since either control can move their sites. */
    const residual: (x: Pair) => Pair = (x: Pair): Pair => {
      const measured: Pair = observe([Math.exp(x[0]), Math.exp(x[1])]);
      if (!measured.every((value: number): boolean => Number.isFinite(value) && value > 0))
        throw new Error("The surface must have two finite positive dimensions");
      return [measured[0] / wanted[0] - 1, measured[1] / wanted[1] - 1];
    };

    let x: Pair = [Math.log(initial[0]), Math.log(initial[1])];
    const step: number = 1e-4;
    for (let round: number = 0; round < 32; round++) {
      const r: Pair = residual(x);
      const error: number = Math.hypot(...r);
      if (Math.max(Math.abs(r[0]), Math.abs(r[1])) < 1e-8)
        return [Math.exp(x[0]), Math.exp(x[1])];
      const a: Pair = residual([x[0] + step, x[1]]);
      const b: Pair = residual([x[0], x[1] + step]);
      const j00: number = (a[0] - r[0]) / step;
      const j10: number = (a[1] - r[1]) / step;
      const j01: number = (b[0] - r[0]) / step;
      const j11: number = (b[1] - r[1]) / step;
      const determinant: number = j00 * j11 - j01 * j10;
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12)
        throw new Error("The surface dimensions do not independently constrain both controls");
      const dx: number = (j11 * r[0] - j01 * r[1]) / determinant;
      const dy: number = (j00 * r[1] - j10 * r[0]) / determinant;
      let accepted: boolean = false;
      for (let damping: number = 1; damping >= 1 / 1024; damping /= 2) {
        const candidate: Pair = [x[0] - damping * dx, x[1] - damping * dy];
        if (!candidate.every((value: number): boolean => Math.abs(value) < 30)) continue;
        if (Math.hypot(...residual(candidate)) >= error) continue;
        x = candidate;
        accepted = true;
        break;
      }
      if (!accepted) throw new Error("The surface solve could not reduce both dimension residuals");
    }
    throw new Error("The surface dimension solve did not converge");
  }
}
