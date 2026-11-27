import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/*
 * A hold instant's still context: the waypoint between its neighbours, read on
 * their seconds and bases, each arm's sites the problem's own or, for a
 * continuation (`HumanArmSeedContinuation`), each arm's moved site wherever the
 * problem has one.
 * Parameter problem: The problem.
 * Parameter around: The waypoints read: the instant between its neighbours.
 * Parameter moved: Each arm's site in place of its own; the problem's when absent.
 * Returns: The still context.
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
    ...(problem.material === undefined ? {} : { material: problem.material }),
    ...(problem.share === undefined ? {} : { share: problem.share }),
    arms: problem.arms.map(
      (
        arm: IProblem["arms"][number],
        a: number,
      ): HumanArmTrajectoryContext.IProblem["arms"][number] => ({
        side: arm.side,
        rest: arm.rest,
        ...(arm.back === undefined ? {} : { back: arm.back }),
        ...(arm.rests === undefined ? {} : { rests: arm.rests }),
        ...(arm.grasp === undefined ? {} : { grasp: arm.grasp }),
        ...(arm.guess === undefined ? {} : { guess: arm.guess }),
        ...(arm.anchor === undefined ? {} : { anchor: arm.anchor }),
        sites: around.map(
          (j: number): IProblem["arms"][number]["sites"][number] =>
            moved === undefined || arm.sites[j] === undefined
              ? arm.sites[j]
              : moved[a],
        ),
      }),
    ),
    still: true,
  });
}

/*
 * The problem an instant reads (`HumanArmTrajectoryContext.IProblem`).
 */
type IProblem = HumanArmTrajectoryContext.IProblem;
