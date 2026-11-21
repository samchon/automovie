import type {
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePoses,
} from "@automovie/interface";

import { AutoMoviePhysicalCoupledTargetError } from "./AutoMoviePhysicalCoupledTargetError";
import { planPhysicalCoupledTargets } from "./planPhysicalCoupledTargets";
import type { IPhysicalCoupledTargetSchedule } from "./preparePhysicalSimulationInput";

/**
 * Admitted groups and the completed report sink of one simulation run. Both
 * the kinematic frame writer and native tracking read the same schedule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Binds a borrowed schedule and report sink to the same run.
 * @evidence contracts/development/design.md#principled-representation The context separates declaration from completed per-step evidence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A producer only needs its current groups and a place to publish their completed reports.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed group leaves no successful report.
 */
export interface IPhysicalCoupledTargetRun {
  readonly schedule: IPhysicalCoupledTargetSchedule;
  readonly record: (
    reports: readonly IAutoMoviePhysicalCoupledTargetFit.IConverged[],
  ) => void;
}

/**
 * Fit the declared members against one scene snapshot. Failure carries the
 * interval's named report and publishes no motor goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the admitted interval, common snapshot and typed failure boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Checks the active membership before the bounded planner. Only its converged result supplies targets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Adds interval context once to the private result or error.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing or overwritten member becomes a named refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the declared member poses once and calls one bounded fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Gives both Engine frame producers the same status projection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps the admitted group and target selection local to each attempt.
 */
export function fitPhysicalCoupledTargetGroup(
  interval: IAutoMoviePhysicalCoupledTargetFit.IInterval,
  input: Parameters<typeof planPhysicalCoupledTargets>[0],
): {
  targets: Readonly<Record<string, IAutoMoviePoses>>;
  report: IAutoMoviePhysicalCoupledTargetFit.IConverged;
} {
  const frame: IAutoMoviePhysicalCoupledTargetFit.IInterval = {
    step: interval.step,
    group: interval.group,
    members: interval.members,
  };
  const active: Set<string> = new Set(
    input.members.map(
      (member: (typeof input.members)[number]): string => member.body,
    ),
  );
  if (
    active.size !== interval.members.length ||
    active.size !== input.members.length ||
    interval.members.some((body: string): boolean => !active.has(body))
  )
    throw new AutoMoviePhysicalCoupledTargetError({
      ...frame,
      kind: "refused",
      reason: "membership",
      detail: "The active targets differ from the admitted group.",
    });
  const result: ReturnType<typeof planPhysicalCoupledTargets> =
    planPhysicalCoupledTargets(input);
  if (result.kind !== "converged")
    throw new AutoMoviePhysicalCoupledTargetError({ ...frame, ...result });
  const { targets, ...fit } = result;
  return { targets, report: { ...frame, ...fit } };
}
