import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
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

/*
 * Combine masses below fixed relative joints in the frame of their nearest
 * moving ancestor. The caller checks the actual clinical coordinates before
 * every shape observation. A changed coordinate invalidates the entire grouped
 * history, including its derivative stencils.
 */
export function prepareRigidFlightMass(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  frames: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  moving: ReadonlySet<AutoMovieHumanoidBone>,
): prepareRigidFlightMass.IPrepared | undefined {
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map(body.skeleton.bones.map((bone) => [bone.bone, bone.parent]));
  const groups: Map<
    AutoMovieHumanoidBone,
    IAutoMovieResolveCenterOfMass.ISegment[]
  > = new Map();
  for (const segment of body.massModel.segments) {
    let carrier: AutoMovieHumanoidBone = segment.bone;
    let remaining: number = parents.size;
    while (!moving.has(carrier)) {
      if (remaining-- === 0) return undefined;
      const parent: AutoMovieHumanoidBone | null | undefined =
        parents.get(carrier);
      if (parent === undefined) return undefined;
      if (parent === null) break;
      carrier = parent;
    }
    let members: IAutoMovieResolveCenterOfMass.ISegment[] | undefined =
      groups.get(carrier);
    if (members === undefined) groups.set(carrier, (members = []));
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
    const back: IAutoMovieQuaternion = Quaternion.inverse(
      carrier.worldRotation,
    );
    const parts: IAutoMovieCombinePhysicalMassProperties.IPart[] = [];
    for (const member of members) {
      const child: IAutoMovieResolvedBone | undefined = frames.get(member.bone);
      if (child === undefined) return undefined;
      const offset: IAutoMovieVector3 = Vector3.subtract(
        child.worldPosition,
        carrier.worldPosition,
      );
      const point: IAutoMovieVector3 = Vector3.add(
        offset,
        Quaternion.rotateVector(child.worldRotation, member.point),
      );
      parts.push({
        mass: member.mass,
        centerOfMass: Quaternion.rotateVector(back, point),
        inertia: member.inertia,
        inertiaRotation: Quaternion.multiply(
          back,
          Quaternion.multiply(child.worldRotation, member.axes),
        ),
      });
    }
    const composite: IAutoMovieCombinePhysicalMassProperties.IPart =
      AutoMovieEnginePhysics.combineMassProperties(parts);
    segments.push({
      bone,
      mass: composite.mass,
      point: composite.centerOfMass,
      inertia: composite.inertia,
      axes: composite.inertiaRotation,
    });
  }
  const names: AutoMovieHumanoidBone[] = pose.joints.map((joint) => joint.bone);
  const fixed: IAutoMoviePose["joints"] = pose.joints
    .filter((joint) => !moving.has(joint.bone))
    .map((joint) => ({ ...joint }));
  return {
    model: {
      mass: segments.reduce(
        (mass: number, part: IAutoMovieResolveCenterOfMass.ISegment): number =>
          mass + part.mass,
        0,
      ),
      segments,
    },
    matches: (value: IAutoMoviePose): boolean => {
      if (value.joints.length !== names.length) return false;
      let index: number = 0;
      for (let i: number = 0; i < names.length; ++i) {
        const joint: IAutoMoviePose["joints"][number] = value.joints[i]!;
        if (joint.bone !== names[i]) return false;
        if (moving.has(joint.bone)) continue;
        const previous: IAutoMoviePose["joints"][number] = fixed[index++]!;
        if (
          !Object.is(joint.flexion, previous.flexion) ||
          !Object.is(joint.abduction, previous.abduction) ||
          !Object.is(joint.twist, previous.twist)
        )
          return false;
      }
      return true;
    },
  };
}

/*
 * A flight's numerical rigid partition and its source-coordinate admission
 * check.
 */
export namespace prepareRigidFlightMass {
  /*
   * Composite bone-frame mass properties, admitted only for poses matching
   * every fixed local coordinate.
   */
  export interface IPrepared {
    /*
     * Same physical mass, with the rigidly carried contributions combined in
     * the carrier frame.
     */
    model: IAutoMovieResolveCenterOfMass.IModel;
    /*
     * Whether the current canonical pose has the fixed articulation used for
     * the subgroup tensors.
     */
    matches(pose: IAutoMoviePose): boolean;
  }
}
