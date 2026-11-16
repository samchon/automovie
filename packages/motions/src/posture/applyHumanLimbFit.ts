import type { IAutoMovieSeededChainFit, IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFitMemory } from "./HumanLimbFitMemory";
import { HumanLimbFitScalars } from "./HumanLimbFitScalars";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Apply an independently issued chain edit during one internal refit.
 * Only untouched caller-owned joints are borrowed; no cached pose record
 * enters the result. The owner transfers its fresh assembly or isolates an
 * explicitly supplied public source at that boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines internal COW ownership, complete output ordering and the independent public-result boundary.
 * @evidence contracts/development/implementation.md#principled-implementation The recipe records actual output order after chain/toe writes. Negative slots address exactly equal current source records, while positive slots supply owned chain writes or exact cached-scalar corrections; original duplicate/filter/append and header ordering remain unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure HumanLimbFitMemory owns lookup/solving and the owned recipe; this helper reconstructs the internal COW pose. The resolver transfers freshly assembled records, while public explicit-pose refit/base boundaries isolate caller-owned input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cached pose escapes, no caller record is mutated and no untouched joint metadata is recreated from a bone table. The original full key/grid, goal, near seed, actual fit and chosen numerical chain values remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Maps B references and consumes W chain/toe replacements plus M exact cached-scalar corrections, M<=B and ordinarily zero. Native fresh assembly needs no redundant full copy; explicit caller-owned sources copy once. Actual solves remain and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Current records are selected only after exact cached scalar/shape equality, not quantized-key equality alone. Differing untouched values/presence/order use owned cached replacements; all replacement/header/seed/value data are independently issued and no cache record escapes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns a B-slot recipe and output reference array, W+M replacements and an owned header/seed/value packet. Borrowed records come only from the current exact-equal caller input, never cache entries/readers; the resolver transfers fresh native input or copies explicit sources. No global state is added here.
 */
export function applyHumanLimbFit(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
  const patch: HumanLimbFitMemory.IPatch = HumanLimbFitMemory.patch(body, pose, limb, goal, placed, rival, near, resolution);
  if (patch.full !== undefined) return patch.full;
  const joints: IAutoMovieJointPose[] = patch.order.map((index: number): IAutoMovieJointPose => {
    const joint: IAutoMovieJointPose | undefined = index < 0 ? pose.joints[-index - 1] : patch.joints[index];
    if (joint === undefined) throw new Error("Limb edit ordering does not match its source");
    return joint;
  });
  return { pose: HumanLimbFitScalars.pose(patch.header, patch.fields, joints), seed: patch.seed,
    ...(patch.value === undefined ? {} : { value: patch.value }) };
}
