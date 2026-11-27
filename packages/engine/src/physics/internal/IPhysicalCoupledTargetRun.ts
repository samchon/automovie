import type { IAutoMoviePhysicalCoupledTargetFit } from "@automovie/interface";

import type { IPhysicalCoupledTargetSchedule } from "./IPhysicalCoupledTargetSchedule";

/*
 * Admitted groups and the completed report sink of one simulation run. Both the
 * kinematic frame writer and native tracking read the same schedule.
 */
export interface IPhysicalCoupledTargetRun {
  /*
   * Groups admitted with the run's input, keyed by output step.
   */
  readonly schedule: IPhysicalCoupledTargetSchedule;

  /*
   * Publish converged reports. A later report for the same step and group
   * replaces the earlier one, as a refit within the step does.
   */
  readonly record: (
    reports: readonly IAutoMoviePhysicalCoupledTargetFit.IConverged[],
  ) => void;
}
