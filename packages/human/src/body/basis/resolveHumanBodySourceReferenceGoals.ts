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
 * The shared document-rig owner supplies one shaped rig and its ordinary pre-pelvis FK/TT result. Capability admission has proved that goal motion cannot change its reference or rig anchors. The reference's rest-to-current travel transports each thigh rest, then the existing joint quaternion owner applies the requested axes/signs/neutral. The existing inverse reads that world target in its source parent frame, yielding the raw coordinate used by correctives, coordination and skinning. Nothing reinterprets legacy pose.
 *
 * The original document remains the saved authority. This internal document removes goals and adds their converted source rows; explicit zero is kept. The source joint's existing envelope conservatively admits requested goals, and the caller admits converted and final actual parent coordinates too. Values use the engine's finite/gimbal conventions, not a certified angular interval or an individual's clinical registration or motion capacity.
 *
 * @evidence contracts/common.md#principled-implementation Admitted source-reference goals compose reference rest-to-current travel with source thigh rest and the shared requested joint rotation; parent/rest removal converts that actual target into source coordinates for ordinary downstream deformation.
 * @evidence contracts/common.md#clear-and-simple-design No goals reuse the document; requested goals validate against the source envelope, convert through one baseline bone map and return an internal document with goal rows replaced by source pose rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing exact capability or out-of-envelope goals refuse; admitted goal-independent reference/anchors remain a caller premise and inverse coordinates do not certify angular uncertainty, individual registration or final clinical acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose states prepared pre-pelvis rig, saved versus internal document authority, retained explicit zero, same source coordinate owner and later converted/final admission.
 * @evidence contracts/performance.md#efficient-algorithms Baseline mapping is linear in B bones; each of G goals scans source joints/skeleton for its contract then performs bounded quaternion/inverse work, giving O(B+G times J) lookup work plus existing pose validation.
 * @evidence contracts/performance.md#reuse-equivalent-work The already prepared baseline rig and common forward/inverse joint owners are reused, and one bone map serves every reference/thigh/parent lookup in this conversion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned internal document owns its new pose array and borrows unchanged saved fields; baseline maps and quaternion intermediates expire, with no retained source cache, external handle or task.
 */
export function resolveHumanBodySourceReferenceGoals(
  input: IHumanBodySourceReferenceGoalContext,
): IAutoMovieHumanBodyBasisDocument {
  const { basis, document, rig }: IHumanBodySourceReferenceGoalContext = input;
  if ((document.thighGoals ?? []).length === 0) return document;
  const goals: NonNullable<IAutoMovieHumanBodyBasisDocument["thighGoals"]> = document.thighGoals!;
  const violations: ReturnType<typeof validatePose>["items"] = validatePose({
    pose: { skeleton: rig.skeleton.id, root: null, joints: goals },
    skeleton: rig.skeleton,
  }).items;
  if (violations.length > 0)
    throw new Error(
      "Body source-reference goal exceeds its source authoring envelope: " +
        JSON.stringify(violations),
    );
  const bones: Map<IHumanBodySourceReferenceGoalContext["baseline"][number]["bone"], IHumanBodySourceReferenceGoalContext["baseline"][number]> = new Map(input.baseline.map((bone: IHumanBodySourceReferenceGoalContext["baseline"][number]): [typeof bone.bone, typeof bone] => [bone.bone, bone]));
  const converted: IAutoMovieJointPose[] = goals.map((goal: typeof goals[number]): IAutoMovieJointPose => {
    const contract: IHumanBodySourceReferenceGoalContext["basis"]["joints"][number]["sourceReferenceGoal"] = basis.joints.find(
      (joint: typeof basis.joints[number]): boolean => joint.bone === goal.bone,
    )?.sourceReferenceGoal;
    if (contract === undefined)
      throw new Error(
        "Body source-reference goal needs an explicit declaration in this exact basis revision: " +
          goal.bone,
      );
    const reference: IHumanBodySourceReferenceGoalContext["baseline"][number] = bones.get(contract.reference)!;
    const thighRest: NonNullable<ReturnType<typeof rig.rest.get>> = rig.rest.get(goal.bone)!;
    const referenceRest: NonNullable<ReturnType<typeof rig.rest.get>> = rig.rest.get(contract.reference)!;
    const travel: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
      reference.worldRotation,
      Quaternion.inverse(referenceRest.rotation),
    );
    const target: ReturnType<typeof Quaternion.normalize> = Quaternion.normalize(
      Quaternion.multiply(
        travel,
        Quaternion.multiply(
          thighRest.rotation,
          jointToQuaternion(goal, rig.axes[goal.bone], rig.frames[goal.bone]),
        ),
      ),
    );
    const sourceJoint: typeof rig.skeleton.bones[number] = rig.skeleton.bones.find(
      (bone: typeof rig.skeleton.bones[number]): boolean => bone.bone === goal.bone,
    )!;
    const parent: IHumanBodySourceReferenceGoalContext["baseline"][number] = bones.get(sourceJoint.parent!)!;
    const local: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
      Quaternion.inverse(parent.worldRotation),
      target,
    );
    const articulation: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
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
