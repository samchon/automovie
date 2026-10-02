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
import { humanBodyShoulderTtRotation } from "./humanBodyShoulderTtRotation";
import { humanBodyShoulderPoseFromDirection } from "./humanBodyShoulderPoseFromDirection";

/**
 * Resolve a thorax-relative total shoulder goal after the declared girdle
 * couplings and the engine's remaining-joint forward kinematics have run.
 *
 * The current upper-chest rotation transports the anatomical basis frame with
 * the thorax. The TT target is measured from hanging to the requested total
 * humerothoracic orientation. Subtract the declared A-pose TT rest to obtain a
 * rest-relative rotation, then solve the humeral world frame regardless of
 * how much the girdle parent has already moved. The girdle still carries the
 * shoulder centre; a rigid delta about that centre transports the arm's
 * descendants, preserving every forearm/hand joint articulation and offset.
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
  const result = baseline.map((bone) => ({ ...bone }));
  const byBone = new Map(result.map((bone) => [bone.bone, bone]));
  const parent = new Map(
    basis.joints.map((joint) => [joint.bone, joint.parent]),
  );
  const thorax = byBone.get("upperChest");
  const thoraxRest = rest.get("upperChest");
  for (const joint of basis.joints) {
    if (joint.shoulder === undefined) continue;
    if (joint.bone !== "leftUpperArm" && joint.bone !== "rightUpperArm")
      throw new Error("A TT shoulder readout needs a named upper arm.");
    if (thorax === undefined || thoraxRest === undefined)
      throw new Error("Thorax-relative shoulder needs an upperChest frame.");
    const arm = byBone.get(joint.bone);
    const armRest = rest.get(joint.bone);
    if (arm === undefined || armRest === undefined)
      throw new Error("Thorax-relative shoulder needs a resolved arm frame.");
    const restDirection = Quaternion.rotateVector(
      armRest.rotation,
      Vector3.create(0, 1, 0),
    );
    const aPose = humanBodyShoulderPoseFromDirection({ bone: joint.bone, direction: restDirection });
    const target = shoulders.find((pose) => pose.bone === joint.bone) ?? aPose;
    const relative = Quaternion.multiply(
      humanBodyShoulderTtRotation(target),
      Quaternion.inverse(humanBodyShoulderTtRotation(aPose)),
    );
    const thoraxTravel = Quaternion.multiply(
      thorax.worldRotation,
      Quaternion.inverse(thoraxRest.rotation),
    );
    const goal = Quaternion.normalize(
      Quaternion.multiply(
        thoraxTravel,
        Quaternion.multiply(relative, armRest.rotation),
      ),
    );
    const delta = Quaternion.normalize(
      Quaternion.multiply(goal, Quaternion.inverse(arm.worldRotation)),
    );
    const pivot = arm.worldPosition;
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
        const girdle = byBone.get(joint.parent!);
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
