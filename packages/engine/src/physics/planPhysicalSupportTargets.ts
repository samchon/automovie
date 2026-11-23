import type {
  IAutoMoviePlanPhysicalSupportTargets,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalChainTarget,
} from "@automovie/interface";

import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSupportRootDrop } from "./physicalSupportRootDrop";
import { solvePhysicalChainTarget } from "./solvePhysicalChainTarget";

/**
 * Feed a changed support placement back to bounded joint goals. Root lowering
 * follows the actual chain reach sphere and an explicit posture budget; it
 * never teleports a body or moves the requested support to hide a residual.
 */
export function planPhysicalSupportTargets(
  input: IAutoMoviePlanPhysicalSupportTargets.IInput,
): IAutoMoviePlanPhysicalSupportTargets.IResult {
  const rootDrop: number = physicalSupportRootDrop(input);
  let targets: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    Object.entries(input.targets).map(
      ([bone, pose]: [string, IAutoMovieRigidTransform]): [
        string,
        IAutoMovieRigidTransform,
      ] => [
        bone,
        {
          position: { ...pose.position, y: pose.position.y - rootDrop },
          rotation: { ...pose.rotation },
        },
      ],
    ),
  );
  const residuals: Record<string, number> = {};
  for (const limb of input.pattern.limbs) {
    const result: IAutoMovieSolvePhysicalChainTarget.IResult =
      solvePhysicalChainTarget({
        profile: input.profile,
        chain: limb.chain,
        targets,
        localPoint: limb.localPoint,
        goal:
          input.goals[limb.bone] ??
          physicalSupportPoint(input.targets[limb.bone]!, limb.localPoint),
        iterations: input.iterations,
        tolerance: input.tolerance,
      });
    targets = result.targets;
    residuals[limb.bone] = result.residual;
  }
  return { targets, rootDrop, residuals };
}
