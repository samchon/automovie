import { HUMANOID_REST_FRAME, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieClinicalAxis,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * A displayed pose with the solver's bones laid over it: every bone whose
 * segment the solver owns at the instant takes its articulation from the
 * solved state, and every other bone keeps the kinematic pose's own.
 *
 * A rig bone's world rotation is its parent's times its rest rotation times
 * its articulation (`resolvePoseBone`). A bone on a three-axis joint takes
 * the articulation `inverse(rest) * inverse(parent) * world`, lowered to
 * clinical angles by the rig's codec (`poseJointCodec`) exactly: the angles
 * compose back to the solved rotation. A bone on a joint with fewer axes is
 * read on its own mobile axes: the solver keeps such a joint on the
 * coordinates of its free axes (`projectPhysicalJointRotation`: with
 * positive w each free coordinate is `2 atan(q.axis / w)` and a locked one
 * is held at zero), so each free coordinate is the joint's exact
 * representation, and it maps back to its clinical axis through the axis's
 * channel, sign and the clinical rest frame
 * (`AutoMovieHumanCanonicalProfile.axesOf`); a locked clinical axis reads
 * as rest. The coordinate chart of these axes is not the clinical chart, so
 * the displayed bone can differ from the solved one where both mobile axes
 * turn (a design debt of the profile, whose rig-axis limits differ from the
 * clinical ranges they are read from). Children are read against the
 * displayed parent, so no difference passes down the chain. An owned root
 * keeps its own articulation and moves the pose's root transform instead.
 * A hand the solver owns holds its welded fingers at their articulation at
 * the window's start (`held`), the shape the solver gave the welded hand.
 * Positions follow the rotations through the rig's rest translations; the
 * solver's joint drift, within its contact tolerance, is not displayed. A
 * pose with no owned bone is returned as given.
 *
 * @param body The performer's body, the rig the pose articulates.
 * @param codec The rig's joint codec, built with the body's joint axes and the humanoid rest frames.
 * @param profile The profile the window solved, its joints' free axes.
 * @param kinematic The pose the window replaces, at the same instant.
 * @param frame The solver's world states of this performer's segments, by bone.
 * @param owned The bones the solver owns at the instant.
 * @param held Each welded hand's finger joints at the window's start.
 * @returns The displayed pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which bones change, the composition inverted, the two joint kinds, the chart difference, the held fingers, the root case and what is not displayed.
 * @evidence contracts/development/implementation.md#principled-implementation Inverts the forward-kinematics composition bone by bone, parent first; three-axis joints by the codec ordinary display composes with, fewer-axis joints by the solver's own free coordinates and the profile's axis-to-clinical mapping. The solver's frames are world bone-origin frames (`bindPhysicalWorld` places each rigid body at its bone's origin).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk of the rig; conversions belong to the codec and the profile's axes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No range clamp: a value outside the clinical range shows as solved. An unowned bone keeps the kinematic record itself, so a window the solver never takes over is the kinematic pose bit for bit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the rig's B bones with constant work each, plus one joint lookup per owned bone; an empty ownership returns at once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading; the caller owns any caching.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pose that shares the kinematic pose's unchanged joint records; retains nothing.
 */
export function readHumanSimulatedPose(
  body: IAutoMovieMotionHumanBody,
  codec: IAutoMoviePoseJointCodec.ICodec,
  profile: IAutoMoviePhysicalProfile,
  kinematic: IAutoMoviePose,
  frame: IAutoMoviePhysicalFrame["bodies"][string],
  owned: ReadonlySet<string>,
  held: ReadonlyMap<string, readonly IAutoMovieJointPose[]>,
): IAutoMoviePose {
  if (owned.size === 0) return kinematic;
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    kinematic.joints.map(
      (
        joint: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [joint.bone, joint],
    ),
  );
  const replaced: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
  for (const hand of owned)
    for (const finger of held.get(hand) ?? [])
      replaced.set(finger.bone, finger);
  const world: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  let root: IAutoMovieTransform | null = kinematic.root;

  // The articulation a joint record stands for; a null angle reads at the
  // clinical rest, the rig angle zero, as forward kinematics reads it.
  const articulation: (bone: AutoMovieHumanoidBone) => IAutoMovieQuaternion = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieQuaternion => {
    const joint: IAutoMovieJointPose | undefined =
      replaced.get(bone) ?? joints.get(bone);
    return joint === undefined
      ? Quaternion.identity()
      : codec.rotation(bone, [
          joint.flexion ?? rest(bone, "flexion"),
          joint.abduction ?? rest(bone, "abduction"),
          joint.twist ?? rest(bone, "twist"),
        ]);
  };

  const walk: (bone: IAutoMovieBone, parent: IAutoMovieQuaternion) => void = (
    bone: IAutoMovieBone,
    parent: IAutoMovieQuaternion,
  ): void => {
    const solved:
      | IAutoMoviePhysicalFrame["bodies"][string][string]
      | undefined = owned.has(bone.bone) ? frame[bone.bone] : undefined;
    const joint: IAutoMoviePhysicalJoint | undefined =
      solved === undefined
        ? undefined
        : profile.joints.find(
            (candidate: IAutoMoviePhysicalJoint): boolean =>
              candidate.child === bone.bone,
          );
    if (solved !== undefined && bone.parent === null) {
      // The root bone keeps its articulation; the root transform carries
      // the solver's placement: world = rootRotation * rest * articulation.
      const local: IAutoMovieQuaternion = Quaternion.multiply(
        bone.rest.rotation,
        articulation(bone.bone),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        solved.rotation,
        Quaternion.inverse(local),
      );
      root = {
        translation: Vector3.subtract(
          solved.position,
          Quaternion.rotateVector(rotation, bone.rest.translation),
        ),
        rotation,
        scale: kinematic.root?.scale ?? { x: 1, y: 1, z: 1 },
      };
      world.set(bone.bone, solved.rotation);
    } else if (
      solved !== undefined &&
      joint !== undefined &&
      joint.axes.length < 3 &&
      frame[joint.parent] !== undefined
    ) {
      replaced.set(bone.bone, mobile(bone.bone, joint, frame));
      world.set(
        bone.bone,
        Quaternion.multiply(
          parent,
          Quaternion.multiply(bone.rest.rotation, articulation(bone.bone)),
        ),
      );
    } else if (solved !== undefined) {
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(bone.rest.rotation),
        Quaternion.multiply(Quaternion.inverse(parent), solved.rotation),
      );
      const [flexion, abduction, twist]: [number, number, number] =
        codec.angles(bone.bone, relative);
      replaced.set(bone.bone, { bone: bone.bone, flexion, abduction, twist });
      world.set(bone.bone, solved.rotation);
    } else
      world.set(
        bone.bone,
        Quaternion.multiply(
          parent,
          Quaternion.multiply(bone.rest.rotation, articulation(bone.bone)),
        ),
      );
    for (const child of body.topology.childrenByParent.get(bone.bone) ?? [])
      walk(child, world.get(bone.bone)!);
  };
  for (const bone of body.skeleton.bones)
    if (bone.parent === null)
      walk(bone, kinematic.root?.rotation ?? Quaternion.identity());

  // Unowned joints keep their records; replaced bones absent from the
  // kinematic pose follow it in rig order.
  return {
    ...kinematic,
    root,
    joints: [
      ...kinematic.joints.map(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
          replaced.get(joint.bone) ?? joint,
      ),
      ...[...replaced.values()].filter(
        (joint: IAutoMovieJointPose): boolean => !joints.has(joint.bone),
      ),
    ],
  };
}

/** A clinical axis's rest, degrees: the angle whose rig angle is zero. */
function rest(
  bone: AutoMovieHumanoidBone,
  axis: AutoMovieClinicalAxis,
): number {
  return HUMANOID_REST_FRAME[bone]?.[axis]?.neutral ?? 0;
}

/**
 * A fewer-axis joint's clinical record from the solver's free coordinates:
 * each free axis's coordinate `2 atan(q.axis / w)` in degrees, mapped to its
 * clinical axis as `rest + coordinateSign * angle`, the inverse of the
 * profile's `sign * (clinical - rest) / restSign` reading; a clinical axis
 * with no free axis reads null, its rest.
 */
function mobile(
  bone: AutoMovieHumanoidBone,
  joint: IAutoMoviePhysicalJoint,
  frame: IAutoMoviePhysicalFrame["bodies"][string],
): IAutoMovieJointPose {
  const q: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(
        frame[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      ),
    ),
    Quaternion.multiply(frame[bone]!.rotation, joint.childFrame.rotation),
  );
  const sign: number = q.w < 0 ? -1 : 1;
  const record: IAutoMovieJointPose = {
    bone,
    flexion: null,
    abduction: null,
    twist: null,
  };
  for (const axis of joint.axes) {
    const clinical: string = axis.channel.slice(
      axis.channel.lastIndexOf(".") + 1,
    );
    if (
      clinical !== "flexion" &&
      clinical !== "abduction" &&
      clinical !== "twist"
    )
      continue;
    const coordinate: number =
      (2 * Math.atan2(q[axis.axis] * sign, Math.abs(q.w)) * 180) / Math.PI;
    record[clinical] =
      rest(bone, clinical) + (axis.coordinateSign ?? 1) * coordinate;
  }
  return record;
}
