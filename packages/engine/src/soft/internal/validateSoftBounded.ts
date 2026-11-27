import type { IAutoMovieViolationCollector } from "@automovie/interface";

/*
 * Report a declared collection of a soft body that is larger than its budget:
 * its path, its size and how far past the budget it runs.
 * Parameter out: The collector.
 * Parameter path: The collection's path.
 * Parameter label: The collection's name in the message.
 * Parameter actual: The declared size.
 * Parameter budget: The largest size admitted.
 */
export function validateSoftBounded(
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
): void {
  if (actual > budget)
    out.push(
      "range",
      path,
      `a soft body may declare at most ${budget} ${label}, but declared ${actual}`,
      actual,
      actual - budget,
    );
}
