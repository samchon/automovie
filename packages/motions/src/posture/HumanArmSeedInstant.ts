import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/** The problem an instant reads (`HumanArmTrajectoryContext.IProblem`). */
type IProblem = HumanArmTrajectoryContext.IProblem;

/**
 * A hold instant's still context: the waypoint between its neighbours, read on
 * their seconds and bases, each arm's sites the problem's own or, for a
 * continuation (`HumanArmSeedContinuation`), each arm's moved site wherever the
 * problem has one.
 *
 * @param problem The problem.
 * @param around The waypoints read: the instant between its neighbours.
 * @param moved Each arm's site in place of its own; the problem's when absent.
 * @returns The still context.
 */
export function HumanArmSeedInstant(
  problem: IProblem,
  around: readonly number[],
  moved?: readonly (M.ISite | undefined)[],
): M.IContext {
  return HumanArmTrajectoryContext({
    body: problem.body,
    times: around.map((j: number): number => problem.times[j]!),
    bases: around.map(
      (j: number): IProblem["bases"][number] => problem.bases[j]!,
    ),
    arms: problem.arms.map(
      (
        arm: IProblem["arms"][number],
      ): HumanArmTrajectoryContext.IProblem["arms"][number] => ({
        side: arm.side,
        rest: arm.rest,
        ...(arm.back === undefined ? {} : { back: arm.back }),
        ...(arm.rests === undefined ? {} : { rests: arm.rests }),
        ...(arm.grasp === undefined ? {} : { grasp: arm.grasp }),
        sites: around.map(
          (j: number): IProblem["arms"][number]["sites"][number] =>
            moved === undefined || arm.sites[j] === undefined
              ? arm.sites[j]
              : moved[problem.arms.indexOf(arm)],
        ),
      }),
    ),
    still: true,
  });
}
