import {
  Quaternion,
  Vector3,
  combinePhysicalMassProperties,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Combine masses below fixed relative joints in the frame of their nearest moving ancestor.
 * The caller checks the actual clinical coordinates before every shape observation. A changed
 * coordinate invalidates the entire grouped history, including its derivative stencils.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The reference uses root-frame solved bones in metres. Each returned mass segment uses the carrying bone's local frame; matches tests actual clinical coordinates that determine the intervening fixed frames.
 * @evidence contracts/development/implementation.md#principled-implementation The parallel-axis tensor of a rigid subtree and its mass-weighted centre transform with the carrying frame. Its linear and angular momentum include the translated and rotating mass of every descendant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Walk mass ancestors once, group local moments with the engine's physical mass owner, and retain the reference clinical slots needed to check later observations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Masses, attachment transforms and principal moments originate in this body's model and actual FK. A varying local transform, missing carrier or unusable composite precludes the reduced path.
 * @evidence contracts/development/implementation.md#efficient-algorithms One preparation visits each mass and its ancestors. Later geometry and inertia see one part per moving group, with a linear pass over public clinical slots to admit the group.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses combinePhysicalMassProperties for each genuine composite and keeps a singleton on its own carrying bone unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The flight owns only its copied local reference slots and numerical mass model. The reference frames, grouping lists and parent map are released after construction.
 */
export function prepareRigidFlightMass(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  frames: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  moving: ReadonlySet<AutoMovieHumanoidBone>,
): prepareRigidFlightMass.IPrepared | undefined {
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> = new Map(
    body.skeleton.bones.map((bone) => [bone.bone, bone.parent]),
  );
  const groups: Map<AutoMovieHumanoidBone, IAutoMovieResolveCenterOfMass.ISegment[]> = new Map();
  for (const segment of body.massModel.segments) {
    let carrier: AutoMovieHumanoidBone = segment.bone;
    let remaining: number = parents.size;
    while (!moving.has(carrier)) {
      if (remaining-- === 0) return undefined;
      const parent: AutoMovieHumanoidBone | null | undefined = parents.get(carrier);
      if (parent === undefined) return undefined;
      if (parent === null) break;
      carrier = parent;
    }
    let members: IAutoMovieResolveCenterOfMass.ISegment[] | undefined = groups.get(carrier);
    if (members === undefined) groups.set(carrier, members = []);
    members.push(segment);
  }
  if (groups.size === body.massModel.segments.length) return undefined;
  const segments: IAutoMovieResolveCenterOfMass.ISegment[] = [];
  for (const [bone, members] of groups) {
    if (members.length === 1 && members[0]!.bone === bone) {
      segments.push(members[0]!);
      continue;
    }
    const carrier: IAutoMovieResolvedBone | undefined = frames.get(bone);
    if (carrier === undefined) return undefined;
    const back: IAutoMovieQuaternion = Quaternion.inverse(carrier.worldRotation);
    const parts: IAutoMovieCombinePhysicalMassProperties.IPart[] = [];
    for (const member of members) {
      const child: IAutoMovieResolvedBone | undefined = frames.get(member.bone);
      if (child === undefined) return undefined;
      const offset: IAutoMovieVector3 = Vector3.subtract(child.worldPosition, carrier.worldPosition);
      const point: IAutoMovieVector3 = Vector3.add(offset, Quaternion.rotateVector(child.worldRotation, member.point));
      parts.push({
        mass: member.mass,
        centerOfMass: Quaternion.rotateVector(back, point),
        inertia: member.inertia,
        inertiaRotation: Quaternion.multiply(back, Quaternion.multiply(child.worldRotation, member.axes)),
      });
    }
    let composite: IAutoMovieCombinePhysicalMassProperties.IPart;
    try {
      composite = combinePhysicalMassProperties(parts);
    } catch {
      // The original ungrouped mass owner retains its own admission and error.
      return undefined;
    }
    segments.push({ bone, mass: composite.mass, point: composite.centerOfMass, inertia: composite.inertia, axes: composite.inertiaRotation });
  }
  const names: AutoMovieHumanoidBone[] = pose.joints.map((joint) => joint.bone);
  const fixed: IAutoMoviePose["joints"] = pose.joints.filter((joint) => !moving.has(joint.bone)).map((joint) => ({ ...joint }));
  return {
    model: { mass: segments.reduce((mass: number, part: IAutoMovieResolveCenterOfMass.ISegment): number => mass + part.mass, 0), segments },
    matches: (value: IAutoMoviePose): boolean => {
      if (value.joints.length !== names.length) return false;
      let index: number = 0;
      for (let i: number = 0; i < names.length; ++i) {
        const joint: IAutoMoviePose["joints"][number] = value.joints[i]!;
        if (joint.bone !== names[i]) return false;
        if (moving.has(joint.bone)) continue;
        const previous: IAutoMoviePose["joints"][number] = fixed[index++]!;
        if (!Object.is(joint.flexion, previous.flexion) || !Object.is(joint.abduction, previous.abduction) ||
          !Object.is(joint.twist, previous.twist)) return false;
      }
      return true;
    },
  };
}

/**
 * A flight's numerical rigid partition and its source-coordinate admission check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation IPrepared owns the compact model and the fixed local clinical comparison governing its use.
 * @evidence contracts/development/design.md#principled-representation Returns the existing physical mass representation and one input predicate for the same rigid coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the physical-flight reducer consumes the model and admission predicate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose history or authored fixed-subtree flag stands in for the current displayed coordinates.
 */
export namespace prepareRigidFlightMass {
  /**
   * Composite bone-frame mass properties, admitted only for poses matching every fixed local coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The model remains in its carrying bones' local frames. matches must accept each actually consumed pose.
   * @evidence contracts/development/design.md#principled-representation Its two fields link a physical reduction to the exact articulation used to derive it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tabulated physical-flight owner reads both fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No estimated mass, prescribed rotation, sample history or substitute pose is carried.
   */
  export interface IPrepared {
    /** Same physical mass, with the rigidly carried contributions combined in the carrier frame. */
    model: IAutoMovieResolveCenterOfMass.IModel;
    /** Whether the current canonical pose has the fixed articulation used for the subgroup tensors. */
    matches(pose: IAutoMoviePose): boolean;
  }
}