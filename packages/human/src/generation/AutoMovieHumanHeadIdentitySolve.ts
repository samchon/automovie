/** Bounded fixed-point closure of measurements on the generated head surface. */
export namespace AutoMovieHumanHeadIdentitySolve {
  /** One independently measured dimension and its positive driving length. */
  export interface IConstraint {
    /** Measurement label, also used in residual reports. */
    name: string;

    /** Required physical dimension in calibration millimetres. */
    target: number;

    /** Measure the current analytic surface rather than its driving key. */
    measure: () => number;

    /** Apply a dimensionless change to the positive driving length. */
    multiply: (factor: number) => void;
  }

  /** Final measured error, including constraints that could not close. */
  export interface IResidual {
    /** Measurement label. */
    name: string;

    /** Signed achieved minus requested dimension in millimetres. */
    error: number;
  }

  /**
   * Close coupled positive dimensions against the surface they actually emit.
   *
   * A simultaneous damped log update avoids privileging the ordering of the
   * measurements. The update is bounded to a factor of two per round, so a
   * temporarily small landmark distance cannot invert or explode a length.
   * The numerical stopping error is 0.025 mm, forty times smaller than the
   * tightest 1 mm head identity allowance. Residuals stay observable when a
   * surface cannot express an independent input.
   */
  export function solve(
    constraints: readonly IConstraint[],
    rebuild: () => void,
  ): IResidual[] {
    for (let round: number = 0; round < 32; round++) {
      rebuild();
      const values: number[] = constraints.map((c: IConstraint): number => c.measure());
      if (values.every((v: number, i: number): boolean => !Number.isFinite(v) || Math.abs(v - constraints[i]!.target) < 0.025)) break;

      for (let i: number = 0; i < constraints.length; i++) {
        const c: IConstraint = constraints[i]!;
        const v: number = values[i]!;
        if (!Number.isFinite(v) || !(v > 0) || !(c.target > 0)) continue;
        const delta: number = Math.max(-Math.LN2, Math.min(Math.LN2, Math.log(c.target / v)));
        c.multiply(Math.exp(delta / 2));
      }
    }
    rebuild();
    return constraints.map((c: IConstraint): IResidual => ({ name: c.name, error: c.measure() - c.target }));
  }
}
