import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";

/** The admitted authored-flight mode of a performance input. */
export type HumanPerformanceFlightMode = NonNullable<
  IAutoMovieMotionHumanPerformance.IInput["flight"]
>;

/**
 * The input's flight mode, `staged` when it names none.
 *
 * @param input The input.
 * @returns `staged` or `physical`.
 */
export function HumanPerformanceFlightMode(
  input: IAutoMovieMotionHumanPerformance.IInput,
): HumanPerformanceFlightMode {
  return input.flight ?? "staged";
}
