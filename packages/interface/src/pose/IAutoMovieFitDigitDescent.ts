

/** Data and callback contracts shared by the FitDigitDescent operations. */
export namespace IAutoMovieFitDigitDescent {
  /** What one descent reads. */
    export interface IProps {
      /** The start, the variables' values. */
      start: readonly number[];
  
      /** The primary residual, metres. */
      primary: (x: readonly number[]) => number[];
  
      /** The secondary residual, metres; empty when there is none. */
      secondary: (x: readonly number[]) => number[];
  
      /** The variables projected into their range. */
      project: (x: readonly number[]) => number[];
  
      /** The variables' resolution: the finite-difference step and the stop. */
      step: number;
  
      /** The primary residual's length at which the primary counts as met, at `x` with its Jacobian. */
      tolerance: (
        x: readonly number[],
        J1: readonly (readonly number[])[],
      ) => number;
    }
}
