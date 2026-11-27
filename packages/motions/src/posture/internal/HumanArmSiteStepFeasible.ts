import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

/*
 * Whether a linearized site constraint can meet one trust box. A linear form
 * takes its extrema on a box by choosing each coordinate's endpoint from the
 * sign of its coefficient. This is a necessary condition for this subproblem
 * alone, so it leaves the other seeds available.
 * Parameter row: The site equality with coefficients in millimetres per degree.
 * Parameter box: The trust box, indexed by the subproblem's variables.
 * Parameter tolerance: The admitted Cartesian residual, millimetres.
 * Returns: Whether the row's possible interval reaches its bound.
 */
export function HumanArmSiteStepFeasible(
  row: IAutoMovieMotionHumanQuadraticProgram.IRow,
  box: readonly Interval[],
  tolerance: number,
): boolean {
  let low: number = 0;
  let high: number = 0;
  row.index.forEach((index: number, i: number): void => {
    const coefficient: number = row.coef[i]!;
    const interval: Interval = box[index]!;
    low += coefficient * (coefficient >= 0 ? interval.l : interval.u);
    high += coefficient * (coefficient >= 0 ? interval.u : interval.l);
  });
  return row.l <= high + tolerance && row.u >= low - tolerance;
}

/*
 * A row's bounds before equilibration.
 */
type Interval = Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, "l" | "u">;
