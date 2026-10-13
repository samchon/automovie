import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import type { IAutoMovieHumanBodySourceProjection } from "./IAutoMovieHumanBodySourceProjection";
import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";
import type { IAutoMovieHumanBodySourceSite } from "./IAutoMovieHumanBodySourceSite";
import { hasHumanBodySourceLocalGoal } from "./hasHumanBodySourceLocalGoal";
import { readHumanBodySourceAxis } from "./readHumanBodySourceAxis";
import { readHumanBodySourcePublicPose } from "./readHumanBodySourcePublicPose";

/**
 * Carry one source bone through its parent and evaluate its local articulation. Ordered source axes use their own pivots and directions; public clinical pose reuses jointToQuaternion in the registered public frame. The source/public rotation conjugation and public-site pivot preserve that same frame without independently solving a second humanoid rig.
 *
 * Requires the graph's admitted finite common-metre rest frames and registered projections. Fixed, public-pose and ordered-axis kinds are supported; other kinds throw. Local/public authority conflicts and coordinate refusals propagate. Source frames and goals stay unchanged, while used can gain consumed addresses before failure.
 *
 * @evidence contracts/common.md#principled-implementation Parent posed-times-inverse-rest carry composes ordered source rotations/translations about registered pivots; clinical turns are conjugated through the same source projection frame.
 * @evidence contracts/common.md#clear-and-simple-design One resolver handles fixed, public-pose and ordered-axis joints, delegating authority choice and clinical/source coordinate reads to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A public local-axis alternative refuses simultaneous authored public authority; no independent humanoid rig is solved and aligned afterward.
 * @evidence contracts/common.md#meaningful-documentation The prose explains parent carry, source pivots and clinical conjugation; expanded prose states admitted graph premises, supported kinds and used-set effects.
 * @evidence contracts/performance.md#efficient-algorithms For A axes, G goals, P public rows and K profile knots, source reads dominate O(A(G+P+K)); fixed carry uses constant work and returned frames have constant size.
 * @evidence contracts/performance.md#reuse-equivalent-work Parent carry is computed once per bone, and a local alternative reuses the ordered-axis branch; evaluated poses are not cached across changed graph inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fresh numerical frames escape; the caller's used set records consumed coordinates and no frame cache or native resource is retained by this helper.
 */
export function resolveHumanBodySourceAxes(
  node: IAutoMovieHumanBodySourceBoneNode,
  parent: IAutoMovieHumanBodyBoneTransform | undefined,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieHumanBodyBoneWorldRest {
  const parentDelta: IAutoMovieQuaternion =
    parent === undefined
      ? Quaternion.identity()
      : Quaternion.multiply(
          parent.posed.rotation,
          Quaternion.inverse(parent.rest.rotation),
        );
  const carry: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
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
    const joint: IAutoMovieHumanBodySourcePublicPoseJoint = node.joint;
    if (hasHumanBodySourceLocalGoal(node.id, joint.localAxes, input)) {
      if (
        (input.authoredPose ?? input.pose).some(
          (one: IAutoMovieJointPose): boolean =>
            one.bone === joint.bone &&
            joint.supportedAxes.some(
              (axis: IAutoMovieHumanBodySourcePublicPoseJoint["supportedAxes"][number]): boolean => one[axis] !== null && one[axis] !== undefined,
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
    const projection: IAutoMovieHumanBodySourceProjection | undefined =
      joint.reference ??
      node.projections.find((one: IAutoMovieHumanBodySourceProjection): boolean => one.bone === joint.bone);
    if (projection === undefined)
      throw new Error(
        "Anatomical public pose lacks its same-node projection: " + node.id,
      );
    const publicTurn: IAutoMovieQuaternion = readHumanBodySourcePublicPose(joint, input, used);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      projection.rotation,
      Quaternion.multiply(publicTurn, Quaternion.inverse(projection.rotation)),
    );
    const origin: IAutoMovieVector3 =
      projection.site === undefined
        ? Vector3.create(0, 0, 0)
        : node.sites.find((one: IAutoMovieHumanBodySourceSite): boolean => one.id === projection.site)!.position;
    const moved: IAutoMovieVector3 = Vector3.add(
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
  let rotation: IAutoMovieQuaternion = Quaternion.identity();
  let translation: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  for (const axis of node.joint.axes) {
    const delta: number =
      readHumanBodySourceAxis(node.id, axis, input, used) - axis.neutral;
    if (axis.kind === "rotation") {
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axis.direction, delta);
      const origin: IAutoMovieVector3 = axis.origin ?? Vector3.create(0, 0, 0);
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
  const joint: IAutoMovieHumanBodyBoneWorldRest = node.joint.frame;
  const inJoint: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(joint.rotation),
    Vector3.subtract(node.rest.position, joint.position),
  );
  const changed: IAutoMovieVector3 = Vector3.add(
    joint.position,
    Quaternion.rotateVector(
      joint.rotation,
      Vector3.add(translation, Quaternion.rotateVector(rotation, inJoint)),
    ),
  );
  const restRelative: IAutoMovieQuaternion = Quaternion.multiply(
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
