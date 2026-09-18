import { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * A skeleton's rest-pose joint span: compose each bone's rest transform down
 * the parent chain (rotation and translation; rigs keep unit scale) and take
 * the world-Y extent of the joints.
 *
 * This is the span between the extreme **joints**, which is not the subject's
 * height and must not be used as one. A rig ends at the joints it needs for
 * animation, and geometry continues past them at both ends: the generated
 * `stickman` puts its highest joint at 0.92 of the declared height and its
 * lowest at 0.24, so this returns 0.680 of the real figure. Framing solved from
 * that number crops an actor's head off. {@link computeModelRestExtentY}
 * measures what a renderer actually draws; use it for anything the camera
 * frames, and keep this for questions genuinely about the rig.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing computeRestHeight derives the skeleton's rest-pose vertical landmark span used when framing a rigged subject.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations computeRestHeight realizes landmark-based framing: A skeleton's rest-pose joint span: compose each bone's rest transform down the parent chain (rotation and translation; rigs keep unit scale) and take the world-Y extent of the joints. This is the span between the extreme **joints**, which is not the subject's height and must not be used as one. A rig ends at the joints it needs for animation, and geometry continues past them at both ends: the generated `stickman` puts its highest joint at 0.92 of the declared height and its lowest at 0.24, so this returns 0.680 of the real figure. Framing solved from that number crops an actor's head off. {@link computeModelRestExtentY} measures what a renderer actually draws; use it for anything the camera frames, and keep this for questions genuinely about the rig.
 */
export const computeRestHeight = (skeleton: IAutoMovieSkeleton): number => {
  if (skeleton.bones.length === 0) return 0;
  const world = restWorldFrames(skeleton);
  let min = Infinity;
  let max = -Infinity;
  for (const bone of skeleton.bones) {
    const y = world.get(bone.bone)!.pos.y;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return max - min;
};

/** One bone's rest-pose placement in model space. */
interface IRestFrame {
  pos: IAutoMovieVector3;
  rot: IAutoMovieQuaternion;
}

/**
 * Every bone's rest-pose model-space frame, composed down the parent chain.
 * Rigs keep unit scale, so translation and rotation are the whole transform.
 */
const restWorldFrames = (
  skeleton: IAutoMovieSkeleton,
): ReadonlyMap<AutoMovieHumanoidBone, IRestFrame> => {
  const byName = new Map<
    AutoMovieHumanoidBone,
    { bone: (typeof skeleton.bones)[number]; index: number }
  >();
  skeleton.bones.forEach((bone, index) => {
    const existing = byName.get(bone.bone);
    if (existing !== undefined)
      throw new Error(
        `skeleton "${skeleton.id}" bone "${bone.bone}" is duplicated at bones[${index}].bone; first declared at bones[${existing.index}].bone`,
      );
    byName.set(bone.bone, { bone, index });
  });
  const world = new Map<AutoMovieHumanoidBone, IRestFrame>();
  const resolving = new Set<AutoMovieHumanoidBone>();
  const resolve = (name: AutoMovieHumanoidBone): IRestFrame => {
    const cached = world.get(name);
    if (cached !== undefined) return cached;
    if (resolving.has(name))
      throw new Error(
        `skeleton "${skeleton.id}" bone parent cycle includes "${name}"`,
      );
    const entry = byName.get(name);
    if (entry === undefined)
      throw new Error(
        `skeleton "${skeleton.id}" bone "${name}" was not provided`,
      );
    resolving.add(name);
    try {
      const bone = entry.bone;
      const frame =
        bone.parent === null
          ? { pos: bone.rest.translation, rot: bone.rest.rotation }
          : (() => {
              const parent = resolve(bone.parent);
              return {
                pos: Vector3.add(
                  parent.pos,
                  Quaternion.rotateVector(parent.rot, bone.rest.translation),
                ),
                rot: Quaternion.multiply(parent.rot, bone.rest.rotation),
              };
            })();
      world.set(name, frame);
      return frame;
    } finally {
      resolving.delete(name);
    }
  };
  for (const bone of skeleton.bones) resolve(bone.bone);
  return world;
};

/** One bone's rest-pose placement in model space. */
interface IRestFrame {
  pos: IAutoMovieVector3;
  rot: IAutoMovieQuaternion;
}
