import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePlanPhysicalBalanceTargets,
  IAutoMoviePlanPhysicalFloorSupportTargets,
  IAutoMoviePlanPhysicalSupportTargets,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSupportRootDrop } from "./physicalSupportRootDrop";
import { planPhysicalFloorSupportTargets } from "./planPhysicalFloorSupportTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";

/*
 * Fit world support intent in the measured floating-base frame. Reach-derived
 * lowering remains a separate root motor request; no lowered virtual root is
 * passed off as the actual stance frame.
 */
export function planPhysicalBalanceTargets(
  input: IAutoMoviePlanPhysicalBalanceTargets.IInput,
): IAutoMoviePlanPhysicalSupportTargets.IResult {
  const original: IAutoMovieRigidTransform = input.targets[input.root.bone]!;
  const targets: Record<string, IAutoMovieRigidTransform> =
    rebasePhysicalTargets(
      input.seed ?? input.targets,
      input.root.bone,
      input.root.pose,
    );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    input.pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): [string, IAutoMovieVector3] => [
        limb.bone,
        input.goals[limb.bone] ??
          physicalSupportPoint(input.targets[limb.bone]!, limb.localPoint),
      ],
    ),
  );
  const rootDrop: number = physicalSupportRootDrop({
    ...input,
    targets: rebasePhysicalTargets(
      input.targets,
      input.root.bone,
      input.intent ?? original,
    ),
    goals,
  });
  const fitted: IAutoMoviePlanPhysicalFloorSupportTargets.IResult =
    planPhysicalFloorSupportTargets({
      ...input,
      targets,
      goals,
      endpointHeights: Object.fromEntries(
        input.planted.map((bone: string): [string, number] => [
          bone,
          goals[bone]!.y,
        ]),
      ),
      maximumRootDrop: 0,
      passes: 1,
    });
  return { targets: fitted.targets, residuals: fitted.residuals, rootDrop };
}
