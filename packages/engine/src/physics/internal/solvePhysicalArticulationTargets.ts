import type { IAutoMovieSolvePhysicalArticulationTargets } from "@automovie/interface";

import { solvePhysicalTargetForest } from "./solvePhysicalTargetForest";

/*
 * Solve a bounded metre residual for one admitted articulation with fixed
 * pivots and projected joint ranges. The caller supplies the pose and row
 * callbacks in its own bone names.
 */
export function solvePhysicalArticulationTargets(
  input: IAutoMovieSolvePhysicalArticulationTargets.IInput,
): IAutoMovieSolvePhysicalArticulationTargets.IResult {
  const { targets, residual } = solvePhysicalTargetForest({
    bones: input.bones,
    iterations: input.iterations,
    tolerance: input.tolerance,
    measure: input.measure,
    linearize: input.linearize,
    targets: input.targets,
    segments: input.profile.segments,
    joints: input.profile.joints,
  });
  return { targets, residual };
}
