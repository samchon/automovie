import {
  Quaternion,
  decomposeJointRotation,
  jointToQuaternion,
  validatePose,
} from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IHumanBodySourceReferenceGoalContext } from "./IHumanBodySourceReferenceGoalContext";

/**
 * Convert explicit source-reference goals into the existing source pose.
 *
 * The shared document-rig owner supplies one shaped rig and its ordinary
 * pre-pelvis FK/TT result. Capability admission has proved that goal motion
 * cannot change its reference or rig anchors. The reference's rest-to-current
 * travel transports each thigh rest, then the existing joint quaternion owner
 * applies the requested axes/signs/neutral. The existing inverse reads that
 * world target in its source parent frame, yielding the raw coordinate used
 * by correctives, coordination and skinning. Nothing reinterprets legacy pose.
 *
 * The original document remains the saved authority. This internal document
 * removes goals and adds their converted source rows; explicit zero is kept.
 * The source joint's existing envelope conservatively admits requested goals,
 * and the caller admits converted and final actual parent coordinates too.
 * Values use the engine's finite/gimbal conventions, not a certified angular
 * interval or an individual's clinical registration or motion capacity.
 */
export function resolveHumanBodySourceReferenceGoals(
  input: IHumanBodySourceReferenceGoalContext,
): IAutoMovieHumanBodyBasisDocument {
  const { basis, document, rig } = input;
  if ((document.thighGoals ?? []).length === 0) return document;
  const goals = document.thighGoals!;
  const violations = validatePose({
    pose: { skeleton: rig.skeleton.id, root: null, joints: goals },
    skeleton: rig.skeleton,
  }).items;
  if (violations.length > 0)
    throw new Error(
      "Body source-reference goal exceeds its source authoring envelope: " +
        JSON.stringify(violations),
    );
  const bones = new Map(input.baseline.map((bone) => [bone.bone, bone]));
  const converted: IAutoMovieJointPose[] = goals.map((goal) => {
    const contract = basis.joints.find(
      (joint) => joint.bone === goal.bone,
    )?.sourceReferenceGoal;
    if (contract === undefined)
      throw new Error(
        "Body source-reference goal needs an explicit declaration in this exact basis revision: " +
          goal.bone,
      );
    const reference = bones.get(contract.reference)!;
    const thighRest = rig.rest.get(goal.bone)!;
    const referenceRest = rig.rest.get(contract.reference)!;
    const travel = Quaternion.multiply(
      reference.worldRotation,
      Quaternion.inverse(referenceRest.rotation),
    );
    const target = Quaternion.normalize(
      Quaternion.multiply(
        travel,
        Quaternion.multiply(
          thighRest.rotation,
          jointToQuaternion(goal, rig.axes[goal.bone], rig.frames[goal.bone]),
        ),
      ),
    );
    const sourceJoint = rig.skeleton.bones.find(
      (bone) => bone.bone === goal.bone,
    )!;
    const parent = bones.get(sourceJoint.parent!)!;
    const local = Quaternion.multiply(
      Quaternion.inverse(parent.worldRotation),
      target,
    );
    const articulation = Quaternion.multiply(
      Quaternion.inverse(sourceJoint.rest.rotation),
      local,
    );
    return {
      bone: goal.bone,
      ...decomposeJointRotation(
        articulation,
        rig.axes[goal.bone],
        rig.frames[goal.bone],
      ),
    };
  });
  return {
    ...document,
    thighGoals: undefined,
    pose: [...(document.pose ?? []), ...converted],
  };
}
