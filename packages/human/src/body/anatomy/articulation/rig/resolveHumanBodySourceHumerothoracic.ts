import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { humanBodyShoulderReaches } from "../../../basis/humanBodyShoulderReaches";
import { humanBodyShoulderTtRotation } from "../../../basis/humanBodyShoulderTtRotation";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import type { IAutoMovieHumanBodySourceHumerothoracicJoint } from "./IAutoMovieHumanBodySourceHumerothoracicJoint";
import { hasHumanBodySourceLocalGoal } from "./hasHumanBodySourceLocalGoal";
import { resolveHumanBodySourceAxes } from "./resolveHumanBodySourceAxes";

/**
 * Resolve the existing total TT goal in the carried thorax while the actual girdle transports its GH pivot.
 *
 * Requires an admitted humerothoracic source joint, its resolved girdle parent and thorax frames in common body metres. Public TT goals use the source degree convention and registered reach; conflicting clinical arm pose or internal GH authority throws. Inputs are unchanged except consumed addresses added through delegated readers to used.
 *
 * @evidence contracts/common.md#principled-implementation The girdle transports the GH pivot while thorax-relative target-minus-neutral TT rotation moves the arm; registered shoulder reach bounds admit the goal before output.
 * @evidence contracts/common.md#clear-and-simple-design This TT-specific resolver separates arm-goal rotation from girdle carry and delegates an explicit internal-axis alternative to the shared axes resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public pose and TT/internal goals cannot coexist on the same arm; source reach is checked without inventing universal shoulder capacity.
 * @evidence contracts/common.md#meaningful-documentation The description identifies TT, thorax carry and GH pivot; expanded prose gives required parent, authority conflicts, source-degree convention and used-set effects.
 * @evidence contracts/performance.md#efficient-algorithms Public and anatomical goal scans plus source reach-envelope lookup dominate time; frame/quaternion arithmetic is fixed-size and local-axis alternatives inherit the shared resolver's axis/profile costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Registered neutral and target TT rotations use the same source conversion owner; no prior arm frame is shared across changing thorax or girdle inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper returns one fresh world frame and only delegates bookkeeping mutations to the caller's used set; it retains no shoulder solver state.
 */
export function resolveHumanBodySourceHumerothoracic(
  node: IAutoMovieHumanBodySourceBoneNode,
  parent: IAutoMovieHumanBodyBoneTransform | undefined,
  thorax: IAutoMovieHumanBodyBoneTransform,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieHumanBodyBoneWorldRest {
  if (node.joint.kind !== "humerothoracic" || parent === undefined)
    throw new Error(
      "Anatomical TT resolution needs a registered girdle parent: " + node.id,
    );
  const joint: IAutoMovieHumanBodySourceHumerothoracicJoint = node.joint;
  const internal: boolean = hasHumanBodySourceLocalGoal(node.id, joint.localAxes, input);
  if (internal && joint.localAxes !== undefined) {
    if (
      input.shoulders.some((one: IAutoMovieHumanBodyShoulderPose): boolean => one.bone === joint.neutral.bone) ||
      (input.authoredPose ?? input.pose).some(
        (one: IAutoMovieJointPose): boolean =>
          one.bone === joint.neutral.bone &&
          [one.flexion, one.abduction, one.twist].some(
            (value: number | null | undefined): boolean => value !== null && value !== undefined,
          ),
      )
    )
      throw new Error(
        "Anatomical GH coordinates conflict with a public arm authority: " +
          node.id,
      );
    return resolveHumanBodySourceAxes(
      {
        ...node,
        joint: { kind: "axes", frame: joint.frame, axes: joint.localAxes },
      },
      parent,
      input,
      used,
    );
  }
  const target: IAutoMovieHumanBodyShoulderPose =
    input.shoulders.find((one: IAutoMovieHumanBodyShoulderPose): boolean => one.bone === joint.neutral.bone) ??
    joint.neutral;
  if (
    (input.authoredPose ?? input.pose).some(
      (one: IAutoMovieJointPose): boolean =>
        one.bone === target.bone &&
        [one.flexion, one.abduction, one.twist].some(
          (value: number | null | undefined): boolean => value !== undefined && value !== null,
        ),
    )
  )
    throw new Error(
      "Anatomical TT goal conflicts with public arm pose: " + node.id,
    );
  if (!humanBodyShoulderReaches(joint.contract, target))
    throw new Error(
      "Anatomical TT goal exceeds its registered source reach: " + node.id,
    );
  const girdleDelta: IAutoMovieQuaternion = Quaternion.multiply(
    parent.posed.rotation,
    Quaternion.inverse(parent.rest.rotation),
  );
  const pivot: IAutoMovieVector3 = Vector3.add(
    parent.posed.position,
    Quaternion.rotateVector(
      girdleDelta,
      Vector3.subtract(joint.frame.position, parent.rest.position),
    ),
  );
  const thoraxDelta: IAutoMovieQuaternion = Quaternion.multiply(
    thorax.posed.rotation,
    Quaternion.inverse(thorax.rest.rotation),
  );
  const relative: IAutoMovieQuaternion = Quaternion.multiply(
    humanBodyShoulderTtRotation(target),
    Quaternion.inverse(humanBodyShoulderTtRotation(joint.neutral)),
  );
  const delta: IAutoMovieQuaternion = Quaternion.multiply(thoraxDelta, relative);
  return {
    position: Vector3.add(
      pivot,
      Quaternion.rotateVector(
        delta,
        Vector3.subtract(node.rest.position, joint.frame.position),
      ),
    ),
    rotation: Quaternion.normalize(
      Quaternion.multiply(delta, node.rest.rotation),
    ),
  };
}
