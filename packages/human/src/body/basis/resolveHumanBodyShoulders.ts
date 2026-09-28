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
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Positions each humerus by the authored total thorax-relative direction while preserving the moved shoulder centre and its attached chain.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Composes direct plane tilt and final-axis torsion, subtracts the measured A-pose and the coupled girdle contribution, and transports the resulting humeral subtree.
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
    if (thorax === undefined || thoraxRest === undefined)
      throw new Error("Thorax-relative shoulder needs an upperChest frame.");
    const arm = byBone.get(joint.bone);
    const armRest = rest.get(joint.bone);
    if (arm === undefined || armRest === undefined)
      throw new Error("Thorax-relative shoulder needs a resolved arm frame.");
    const side = joint.bone === "leftUpperArm" ? 1 : -1;
    const restDirection = Quaternion.rotateVector(
      armRest.rotation,
      Vector3.create(0, 1, 0),
    );
    const aPose = {
      bone: joint.bone,
      plane:
        (Math.atan2(restDirection.z, side * restDirection.x) * 180) / Math.PI,
      elevation:
        (Math.acos(Math.max(-1, Math.min(1, -restDirection.y))) * 180) /
        Math.PI,
      axialRotation: 0,
    } as IAutoMovieHumanBodyShoulderPose;
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
