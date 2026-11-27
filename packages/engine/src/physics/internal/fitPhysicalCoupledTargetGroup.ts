import type {
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePoses,
} from "@automovie/interface";

import { AutoMovieEnginePhysicalCoupledTargetError } from "../AutoMovieEnginePhysicalCoupledTargetError";
import { planPhysicalCoupledTargets } from "./planPhysicalCoupledTargets";

/*
 * Fit the declared members against one scene snapshot. Failure carries the
 * interval's named report and publishes no motor goals.
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
    throw new AutoMovieEnginePhysicalCoupledTargetError({
      ...frame,
      kind: "refused",
      reason: "membership",
      detail: "The active targets differ from the admitted group.",
    });
  const result: ReturnType<typeof planPhysicalCoupledTargets> =
    planPhysicalCoupledTargets(input);
  if (result.kind !== "converged")
    throw new AutoMovieEnginePhysicalCoupledTargetError({ ...frame, ...result });
  const { targets, ...fit } = result;
  return { targets, report: { ...frame, ...fit } };
}
