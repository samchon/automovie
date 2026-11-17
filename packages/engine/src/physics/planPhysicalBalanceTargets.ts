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

/**
 * Fit world support intent in the measured floating-base frame. Reach-derived lowering remains a separate root motor request; no lowered virtual root is passed off as the actual stance frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Fit world support intent in the measured floating-base frame) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Fit world support intent in the measured floating-base frame) directly over its typed inputs (`input`) as 2 sequential passes (map over input.pattern.limbs; map over input.planted), delegating to `rebasePhysicalTargets`, `Object.fromEntries`, `physicalSupportPoint`, `physicalSupportRootDrop`, `planPhysicalFloorSupportTargets`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 43 lines and 6 top-level statements that reuses `rebasePhysicalTargets`, `Object.fromEntries`, `physicalSupportPoint`, `physicalSupportRootDrop`, `planPhysicalFloorSupportTargets` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (map over input.pattern.limbs; map over input.planted), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
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
