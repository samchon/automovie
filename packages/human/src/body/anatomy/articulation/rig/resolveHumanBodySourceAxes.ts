import { Quaternion, Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { hasHumanBodySourceLocalGoal } from "./hasHumanBodySourceLocalGoal";
import { readHumanBodySourceAxis } from "./readHumanBodySourceAxis";
import { readHumanBodySourcePublicPose } from "./readHumanBodySourcePublicPose";

/**
 * Carry one source bone through its parent and evaluate its local articulation.
 * Ordered source axes use their own pivots and directions; public clinical pose
 * reuses jointToQuaternion in the registered public frame. The source/public
 * rotation conjugation and public-site pivot preserve that same frame without
 * independently solving a second humanoid rig.
 *
 * @evidence contracts/common.md#principled-implementation Public articulation is conjugated through its actual source projection and pivots at the same named site.
 * @evidence contracts/common.md#clear-and-simple-design One parent carry and one joint evaluation produce the source bone frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuses engine clinical conversion instead of equating flexion/abduction with generic Euler angles.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes authored intrinsic axes from the existing public clinical conversion.
 * @evidence contracts/modeling.md#parameter-channels Source axes retain declared order/neutral/pivot; public pose retains the actual basis axes and rest-frame mapping.
 * @evidence contracts/modeling.md#spatial-conventions Rest/world positions are metres; local source pivots and unit axes meet at their named joint frame; engine axis-angle inputs are degrees.
 * @evidence contracts/anatomy.md#anatomical-source Source registration owns joint axes/sites; this evaluator preserves their account rather than inventing anatomical landmark values.
 * @evidence contracts/anatomy.md#parametric-authority Uses only closed named motion goals and source registration; source/public matrices are generated results.
 * @author Samchon
 */
export function resolveHumanBodySourceAxes(
  node: IAutoMovieHumanBodySourceBoneNode,
  parent: IAutoMovieHumanBodyBoneTransform | undefined,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieHumanBodyBoneWorldRest {
  const parentDelta =
    parent === undefined
      ? Quaternion.identity()
      : Quaternion.multiply(
          parent.posed.rotation,
          Quaternion.inverse(parent.rest.rotation),
        );
  const carry = (point: IAutoMovieHumanBodyBoneWorldRest["position"]) =>
    parent === undefined
      ? { ...point }
      : Vector3.add(
          parent.posed.position,
          Quaternion.rotateVector(
            parentDelta,
            Vector3.subtract(point, parent.rest.position),
          ),
        );
  if (node.joint.kind === "fixed")
    return {
      position: carry(node.rest.position),
      rotation: Quaternion.multiply(parentDelta, node.rest.rotation),
    };
  if (node.joint.kind === "public-pose") {
    const joint = node.joint;
    if (hasHumanBodySourceLocalGoal(node.id, joint.localAxes, input)) {
      if (
        (input.authoredPose ?? input.pose).some(
          (one) =>
            one.bone === joint.bone &&
            joint.supportedAxes.some(
              (axis) => one[axis] !== null && one[axis] !== undefined,
            ),
        )
      )
        throw new Error(
          "Anatomical local coordinates conflict with authored public pose: " +
            node.id,
        );
      if (joint.localFrame === undefined)
        throw new Error(
          "Anatomical local axes lack their actual source joint frame: " +
            node.id,
        );
      return resolveHumanBodySourceAxes(
        {
          ...node,
          joint: {
            kind: "axes",
            frame: joint.localFrame,
            axes: joint.localAxes!,
          },
        },
        parent,
        input,
        used,
      );
    }
    const projection =
      joint.reference ??
      node.projections.find((one) => one.bone === joint.bone);
    if (projection === undefined)
      throw new Error(
        "Anatomical public pose lacks its same-node projection: " + node.id,
      );
    const publicTurn = readHumanBodySourcePublicPose(joint, input, used);
    const rotation = Quaternion.multiply(
      projection.rotation,
      Quaternion.multiply(publicTurn, Quaternion.inverse(projection.rotation)),
    );
    const origin =
      projection.site === undefined
        ? Vector3.create(0, 0, 0)
        : node.sites.find((one) => one.id === projection.site)!.position;
    const moved = Vector3.add(
      node.rest.position,
      Quaternion.rotateVector(
        node.rest.rotation,
        Vector3.subtract(origin, Quaternion.rotateVector(rotation, origin)),
      ),
    );
    return {
      position: carry(moved),
      rotation: Quaternion.multiply(
        parentDelta,
        Quaternion.multiply(node.rest.rotation, rotation),
      ),
    };
  }
  if (node.joint.kind !== "axes")
    throw new Error(
      "Ordered source coordinates require an axes joint: " + node.id,
    );
  let rotation = Quaternion.identity();
  let translation = Vector3.create(0, 0, 0);
  for (const axis of node.joint.axes) {
    const delta =
      readHumanBodySourceAxis(node.id, axis, input, used) - axis.neutral;
    if (axis.kind === "rotation") {
      const turn = Quaternion.fromAxisAngle(axis.direction, delta);
      const origin = axis.origin ?? Vector3.create(0, 0, 0);
      translation = Vector3.add(
        translation,
        Quaternion.rotateVector(
          rotation,
          Vector3.subtract(origin, Quaternion.rotateVector(turn, origin)),
        ),
      );
      rotation = Quaternion.multiply(rotation, turn);
    } else
      translation = Vector3.add(
        translation,
        Quaternion.rotateVector(rotation, Vector3.scale(axis.direction, delta)),
      );
  }
  const joint = node.joint.frame;
  const inJoint = Quaternion.rotateVector(
    Quaternion.inverse(joint.rotation),
    Vector3.subtract(node.rest.position, joint.position),
  );
  const changed = Vector3.add(
    joint.position,
    Quaternion.rotateVector(
      joint.rotation,
      Vector3.add(translation, Quaternion.rotateVector(rotation, inJoint)),
    ),
  );
  const restRelative = Quaternion.multiply(
    Quaternion.inverse(joint.rotation),
    node.rest.rotation,
  );
  return {
    position: carry(changed),
    rotation: Quaternion.multiply(
      parentDelta,
      Quaternion.multiply(
        joint.rotation,
        Quaternion.multiply(rotation, restRelative),
      ),
    ),
  };
}
