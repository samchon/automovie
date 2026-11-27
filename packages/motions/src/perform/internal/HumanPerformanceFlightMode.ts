import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";

/*
 * The admitted authored-flight mode of a performance input.
 */
export type HumanPerformanceFlightMode = NonNullable<
  IAutoMovieMotionHumanPerformance.IInput["flight"]
>;

/*
 * The input's flight mode, `staged` when it names none.
 * Parameter input: The input.
 * Returns: `staged` or `physical`.
 */
export function HumanPerformanceFlightMode(
  input: IAutoMovieMotionHumanPerformance.IInput,
): HumanPerformanceFlightMode {
  return input.flight ?? "staged";
}
