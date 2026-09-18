import { IAutoMovieAimDriver, IAutoMovieDriver, IAutoMovieIKDriver, IAutoMovieParentDriver, IAutoMovieTransform } from "@automovie/interface";
import { applyIterativeIK } from "./iterativeIK";

/**
 * The world-space DRIVE pass: drivers that need the composed hierarchy (a
 * node's world position/orientation) rather than just other channels. It runs
 * **after** the initial compose, reads world matrices, recomputes the owner's
 * world transform, and recomposes the owner's subtree so descendants follow.
 *
 * This step resolves {@link IAutoMovieAimDriver} (look-at: orient a node so one
 * of its axes points at a target: eyes, head, a camera),
 * {@link IAutoMovieParentDriver} (Child-Of: make a node inherit another's world
 * frame, per component: a sword following a hand), the analytic two-bone
 * {@link IAutoMovieIKDriver} (back-solve a 3-node limb so its tip reaches a
 * goal: arms, legs), and the iterative `ccd`/`fabrik` solvers for longer chains
 * ({@link applyIterativeIK}, fixed budgets, S2 of the core wiring). Only
 * `spring` still defers here: it is stateful, and steps inside
 * {@link resolveFrame} when the caller provides `dt` + state, or in the host's
 * own pass otherwise; nothing is silently dropped.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Evaluates each driver that depends on composed world state.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Implements the world-space stage of the declared deterministic driver graph.
 * @author Samchon
 */
export const resolveWorldDrivers = (
  drivers: IAutoMovieDriver[],
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): IAutoMovieDriver[] => {
  const deferred: IAutoMovieDriver[] = [];
  for (const d of drivers)
    if (d.type === "aim") applyAim(d, world, localById, childrenById);
    else if (d.type === "parent")
      applyParent(d, world, localById, childrenById);
    else if (d.type === "ik" && d.solver === "twoBone" && d.chain.length === 3)
      applyTwoBoneIK(d, world, localById, childrenById);
    else if (d.type === "ik" && (d.solver === "ccd" || d.solver === "fabrik"))
      applyIterativeIK(d, world, localById, childrenById);
    else deferred.push(d);
  return deferred;
};
