import type { IAutoMovieSeededChainFit, IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFitMemory } from "./HumanLimbFitMemory";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Apply an independently issued chain edit during one internal refit.
 * Only untouched caller-owned joints are borrowed; no cached pose record
 * enters the result. The public refit boundary issues its complete copy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines internal COW ownership, complete output ordering and the independent public-result boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Engine writes are confined to the chain's three bones plus possible contact toes. The actual recipe removes those current source records and interleaves owned selected replacements with remaining source records in exactly the fitted output order, including duplicates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure HumanLimbFitMemory owns lookup/solving and the owned recipe; this helper performs only reconstruction, and refitHumanPosture owns final public isolation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cached pose escapes, no caller record is mutated and no untouched joint metadata is recreated from a bone table. The original full key/grid, goal, near seed, actual fit and chosen numerical chain values remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Filters/maps B joint references and copies only the W actual chain/toe replacement records in the recipe; one final public full copy replaces repeated B-object copies between limbs. Actual solver costs remain and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Untouched current-source records retain their exact ordering and metadata under the engine's proven filter/append law. Every replacement/seed/value is independently issued, with no sharing of private cache records or a result from another target.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous call owns a numeric recipe, small replacement set and two B-reference arrays until return. Its COW pose borrows only caller input, never cache entries or readers; the enclosing public refit copies before escape and no global state is added here.
 */
export function applyHumanLimbFit(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
  const patch: HumanLimbFitMemory.IPatch = HumanLimbFitMemory.patch(body, pose, limb, goal, placed, rival, near, resolution);
  const retained: IAutoMovieJointPose[] = pose.joints.filter((joint: IAutoMovieJointPose): boolean => !patch.written.has(joint.bone));
  let at: number = 0;
  const joints: IAutoMovieJointPose[] = patch.order.map((index: number): IAutoMovieJointPose =>
    index < 0 ? retained[at++]! : patch.joints[index]!,
  );
  return { pose: { ...pose, joints }, seed: patch.seed, ...(patch.value === undefined ? {} : { value: patch.value }) };
}
