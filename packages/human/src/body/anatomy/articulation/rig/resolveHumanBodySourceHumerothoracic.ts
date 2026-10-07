import { Quaternion, Vector3 } from "@automovie/engine";

import { humanBodyShoulderReaches } from "../../../basis/humanBodyShoulderReaches";
import { humanBodyShoulderTtRotation } from "../../../basis/humanBodyShoulderTtRotation";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { hasHumanBodySourceLocalGoal } from "./hasHumanBodySourceLocalGoal";
import { resolveHumanBodySourceAxes } from "./resolveHumanBodySourceAxes";

/** Resolve the existing total TT goal in the carried thorax while the actual girdle transports its GH pivot. */
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
  const joint = node.joint;
  const internal = hasHumanBodySourceLocalGoal(node.id, joint.localAxes, input);
  if (internal && joint.localAxes !== undefined) {
    if (
      input.shoulders.some((one) => one.bone === joint.neutral.bone) ||
      (input.authoredPose ?? input.pose).some(
        (one) =>
          one.bone === joint.neutral.bone &&
          [one.flexion, one.abduction, one.twist].some(
            (value) => value !== null && value !== undefined,
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
  const target =
    input.shoulders.find((one) => one.bone === joint.neutral.bone) ??
    joint.neutral;
  if (
    (input.authoredPose ?? input.pose).some(
      (one) =>
        one.bone === target.bone &&
        [one.flexion, one.abduction, one.twist].some(
          (value) => value !== undefined && value !== null,
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
  const girdleDelta = Quaternion.multiply(
    parent.posed.rotation,
    Quaternion.inverse(parent.rest.rotation),
  );
  const pivot = Vector3.add(
    parent.posed.position,
    Quaternion.rotateVector(
      girdleDelta,
      Vector3.subtract(joint.frame.position, parent.rest.position),
    ),
  );
  const thoraxDelta = Quaternion.multiply(
    thorax.posed.rotation,
    Quaternion.inverse(thorax.rest.rotation),
  );
  const relative = Quaternion.multiply(
    humanBodyShoulderTtRotation(target),
    Quaternion.inverse(humanBodyShoulderTtRotation(joint.neutral)),
  );
  const delta = Quaternion.multiply(thoraxDelta, relative);
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
