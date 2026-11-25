import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryStretch as Stretch } from "./HumanArmTrajectoryStretch";

/**
 * The refusal for time of a span whose solve the law's own pace holds off: the
 * same problem solved again from the same start with the speed bound lifted
 * (each probe's pace unbounded), and, where that path meets every other term,
 * the span it needs at the law's pace, `Pace.slower` of its played frames,
 * refused for its duration with the path handed on (`IMirrorTold.state`) so the
 * law re-times its action (TOPP-RA, `HumanArmTrajectoryRetime`) and the replan
 * starts from it: the same path over a longer span moves within the bound
 * (Hollerbach and Flash 1982, Biol Cybern 44:67). None where the path misses
 * another term without the bound too: the refusal is then the region's.
 *
 * @param grid The span's frame grid and readers.
 * @param initial The span's first knots.
 * @param seed The start the refused solve took.
 * @param told Where the path is handed on.
 * @returns The refusal for time; none where the pace is not what binds.
 */
export function HumanArmTrajectoryPaced(
  grid: Stretch.IGrid,
  initial: Stretch.IKnots,
  seed: number[][][],
  told: HumanArmTrajectory.IMirrorTold,
): HumanRefusal | undefined {
  const free: (c: M.IContext) => M.IContext = (c: M.IContext): M.IContext => ({
    ...c,
    speed: (): number => Infinity,
  });
  const loose: Stretch.ISolved = Stretch.optimise(
    {
      ...grid,
      contextOf: (...args: Parameters<Stretch.ContextOf>): M.IContext =>
        free(grid.contextOf(...args)),
      fine: free(grid.fine),
    },
    { ...initial, context: free(initial.context) },
    seed,
  );
  if (!Stretch.met(loose)) return undefined;
  const at: readonly number[] = loose.context.times;
  const span: number = at[at.length - 1]! - at[0]!;
  told.state = { times: [...at], x: loose.x, penalty: loose.penalty };
  return new HumanRefusal({
    kind: "reach",
    axis: "duration",
    value: span,
    feasible: {
      kind: "range",
      minimum: Pace.duration(span * Pace.slower(grid.fine, loose.played.x)),
      maximum: null,
      unit: "s",
    },
    reason: `the path of the ${loose.problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action moves faster than the law's own pace`,
    fix: "give the action more time",
  });
}
