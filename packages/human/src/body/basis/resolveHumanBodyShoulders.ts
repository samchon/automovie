import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderPoseFromDirection } from "./humanBodyShoulderPoseFromDirection";
import { humanBodyShoulderTtRotation } from "./humanBodyShoulderTtRotation";

/**
 * Resolve a thorax-relative total shoulder goal after the declared girdle couplings and the engine's remaining-joint forward kinematics have run.
 *
 * The current upper-chest rotation transports the anatomical basis frame with the thorax. The TT target is measured from hanging to the requested total humerothoracic orientation. Read the supplied shaped arm-rest direction through the shared TT owner and remove that rest rotation from the target to obtain a rest-relative rotation, then solve the humeral world frame regardless of how much the girdle parent has already moved. The girdle still carries the shoulder centre; a rigid delta about that centre transports the arm's descendants, preserving every forearm/hand joint articulation and offset.
 *
 * Goals have already passed the basis's TT reach admission. The shaped rest readout supplies omitted goals with conventional zero torsion; one axis direction provides no measured humeral axial frame. A rigid descendant turn does not establish tissue clearance or clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation Actual upper-chest travel carries the shaped humeral rest-to-target TT rotation, then a rigid delta about the resolved shoulder centre transports the arm and descendants while preserving their relative articulations.
 * @evidence contracts/common.md#clear-and-simple-design Copied baseline records and bone/parent maps separate goal construction from descendant traversal and local humeral parent readout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing thorax/arm/girdle frames or a shoulder on another bone refuse; caller-owned reach admission and conventional unmeasured torsion remain explicit rather than inferred anatomical or clearance proof.
 * @evidence contracts/common.md#meaningful-documentation The prose gives post-girdle timing, shaped rest versus requested TT goal, preserved centre/descendant articulation and the prior admission/physical limitations.
 * @evidence contracts/performance.md#efficient-algorithms Baseline and joint maps build linearly; each registered shoulder scans goal rows and follows ancestry for every resolved bone, costing O(S times (P+B times H)) for S shoulders and hierarchy depth H.
 * @evidence contracts/performance.md#reuse-equivalent-work Bone and parent maps serve both arms, shared TT/direction quaternion owners define rest and goal consistently, and one delta is reused across each arm's descendants.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned copied resolved records own changed world coordinates; maps and quaternion temporaries expire on return, with no source mutation, persistent pose cache, handle or task.
 */
export function resolveHumanBodyShoulders(
  basis: Pick<IAutoMovieHumanBodyBasis, "joints">,
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[],
  rest: ReadonlyMap<
    AutoMovieHumanoidBone,
    { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
  >,
  baseline: readonly IAutoMovieResolvedBone[],
): IAutoMovieResolvedBone[] {
  const result: IAutoMovieResolvedBone[] = baseline.map((bone: IAutoMovieResolvedBone): IAutoMovieResolvedBone => ({ ...bone }));
  const byBone: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(result.map((bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone]));
  const parent: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> = new Map(
    basis.joints.map((joint: typeof basis.joints[number]): [AutoMovieHumanoidBone, AutoMovieHumanoidBone | null] => [joint.bone, joint.parent]),
  );
  const thorax: IAutoMovieResolvedBone | undefined = byBone.get("upperChest");
  const thoraxRest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } | undefined = rest.get("upperChest");
  for (const joint of basis.joints) {
    if (joint.shoulder === undefined) continue;
    if (joint.bone !== "leftUpperArm" && joint.bone !== "rightUpperArm")
      throw new Error("A TT shoulder readout needs a named upper arm.");
    if (thorax === undefined || thoraxRest === undefined)
      throw new Error("Thorax-relative shoulder needs an upperChest frame.");
    const arm: IAutoMovieResolvedBone | undefined = byBone.get(joint.bone);
    const armRest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } | undefined = rest.get(joint.bone);
    if (arm === undefined || armRest === undefined)
      throw new Error("Thorax-relative shoulder needs a resolved arm frame.");
    const restDirection: IAutoMovieVector3 = Quaternion.rotateVector(
      armRest.rotation,
      Vector3.create(0, 1, 0),
    );
    const aPose: IAutoMovieHumanBodyShoulderPose = humanBodyShoulderPoseFromDirection({
      bone: joint.bone,
      direction: restDirection,
    });
    const target: IAutoMovieHumanBodyShoulderPose = shoulders.find((pose: IAutoMovieHumanBodyShoulderPose): boolean => pose.bone === joint.bone) ?? aPose;
    const relative: IAutoMovieQuaternion = Quaternion.multiply(
      humanBodyShoulderTtRotation(target),
      Quaternion.inverse(humanBodyShoulderTtRotation(aPose)),
    );
    const thoraxTravel: IAutoMovieQuaternion = Quaternion.multiply(
      thorax.worldRotation,
      Quaternion.inverse(thoraxRest.rotation),
    );
    const goal: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        thoraxTravel,
        Quaternion.multiply(relative, armRest.rotation),
      ),
    );
    const delta: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(goal, Quaternion.inverse(arm.worldRotation)),
    );
    const pivot: IAutoMovieVector3 = arm.worldPosition;
    for (const bone of result) {
      let child: AutoMovieHumanoidBone | null | undefined = bone.bone;
      while (child !== null && child !== undefined && child !== joint.bone)
        child = parent.get(child);
      if (child !== joint.bone) continue;
      bone.worldPosition = Vector3.add(
        pivot,
        Quaternion.rotateVector(
          delta,
          Vector3.subtract(bone.worldPosition, pivot),
        ),
      );
      bone.worldRotation = Quaternion.normalize(
        Quaternion.multiply(delta, bone.worldRotation),
      );
      if (bone.bone === joint.bone) {
        const girdle: IAutoMovieResolvedBone | undefined = byBone.get(joint.parent!);
        if (girdle === undefined)
          throw new Error("Thorax-relative shoulder needs a girdle parent.");
        bone.localRotation = Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.inverse(girdle.worldRotation),
            bone.worldRotation,
          ),
        );
      }
    }
  }
  return result;
}
