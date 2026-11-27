import type { IAutoMovieStepPlanner } from "@automovie/interface";

/*
 * A step timed from a moment again: its start moved there and its end with it,
 * keeping its duration. A request not yet lifted keeps being timed from now
 * until it lifts, and is timed from its lift-off then.
 * Parameter step: The step.
 * Parameter seconds: The new start, local seconds.
 * Returns: A new step; the input is unchanged.
 */
export function retimePhysicalRecoveryStep(
  step: IAutoMovieStepPlanner.IStep,
  seconds: number,
): IAutoMovieStepPlanner.IStep {
  return { ...step, end: seconds + (step.end - step.start), start: seconds };
}
