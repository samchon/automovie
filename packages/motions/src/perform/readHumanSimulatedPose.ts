import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalFrame,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * A displayed pose with the solver's bones laid over it: every bone whose
 * segment the solver owns at the instant takes the world rotation the
 * solver gave it, and every other bone keeps the kinematic pose's own
 * articulation.
 *
 * A rig bone's world rotation is its parent's times its rest rotation times
 * its articulation (`resolvePoseBone`), so an owned bone's articulation is
 * `inverse(rest) * inverse(parent) * world`, its parent read from the pose
 * being built so a chain of owned bones composes back to the solver's
 * rotations. The articulation is lowered to clinical angles by the rig's
 * codec (`poseJointCodec`), exactly: the codec's angles compose back to the
 * same rotation, so the displayed bone turns as the solved one does, with no
 * clamp: the solver's joint limits are the body's clinical ranges read onto
 * its axes (`AutoMovieHumanCanonicalProfile`), and the display shows what the
 * solver holds. An owned root keeps its own articulation and moves the
 * pose's root transform instead, so the root bone lies where the solver put
 * it. Bone positions follow from the rotations through the rig's rest
 * translations; the solver's joint drift, within its contact tolerance, is
 * not displayed. A pose with no owned bone is returned as given.
 *
 * @param body The performer's body, the rig the pose articulates.
 * @param codec The rig's joint codec, built with the body's joint axes and the humanoid rest frames.
 * @param kinematic The pose the window replaces, at the same instant.
 * @param frame The solver's world states of this performer's segments, by bone.
 * @param owned The bones the solver owns at the instant.
 * @returns The displayed pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which bones change, the composition inverted, the exact lowering to angles, the root case and what is not displayed.
 * @evidence contracts/development/implementation.md#principled-implementation Inverts the forward-kinematics composition bone by bone, parent first, and lowers rotations with the codec ordinary display composes them with; the solver's frames are world bone-origin frames (`bindPhysicalWorld` places each rigid body at its bone's origin).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk of the rig; conversions belong to the codec.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is special-cased; an unowned bone keeps the kinematic record itself, so a window the solver never takes over is the kinematic pose bit for bit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the rig's B bones with constant quaternion work each; an empty ownership returns at once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading; the caller owns any caching.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pose that shares the kinematic pose's unchanged joint records; retains nothing.
 */
export function readHumanSimulatedPose(
  body: IAutoMovieMotionHumanBody,
  codec: IAutoMoviePoseJointCodec.ICodec,
  kinematic: IAutoMoviePose,
  frame: IAutoMoviePhysicalFrame["bodies"][string],
  owned: ReadonlySet<string>,
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
  const world: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  let root: IAutoMovieTransform | null = kinematic.root;

  // The articulation a joint record stands for; a null angle reads as zero.
  const articulation = (bone: AutoMovieHumanoidBone): IAutoMovieQuaternion => {
    const joint: IAutoMovieJointPose | undefined =
      replaced.get(bone) ?? joints.get(bone);
    return joint === undefined
      ? Quaternion.identity()
      : codec.rotation(bone, [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ]);
  };

  const walk = (bone: IAutoMovieBone, parent: IAutoMovieQuaternion): void => {
    const solved:
      | IAutoMoviePhysicalFrame["bodies"][string][string]
      | undefined = owned.has(bone.bone) ? frame[bone.bone] : undefined;
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

  // Unowned joints keep their records; owned bones absent from the
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
