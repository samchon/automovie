import { AutoMovieHumanoidBone, IAutoMovieModel, IAutoMovieQuaternion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { placeTransformedPoint } from "./placeTransformedPoint";

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

/**
 * A model's rest-pose box in model space: the axis-aligned range of the geometry
 * a renderer would actually draw, on all three axes.
 *
 * {@link computeModelRestExtentY} is this measurement read on one axis, and the
 * two are the same traversal for the reason the vertical one gives: every part
 * is placed the way the renderer places it, and primitives are measured through
 * {@link tessellate}, the code that produces the vertices, so the extent cannot
 * drift from the picture.
 *
 * The horizontal half is what a subject wider than it is tall is framed and
 * graded from. A figure is taller than it is wide at every shot size, so its
 * width never decides its distance; a building element is the opposite, and a
 * 60 m facade authored outward from its element origin has a drawn box of
 * `x 0…60, y 0…24, z −1…1` where the vertical read alone reports only
 * `y 0…24`. Returns null when a model has nothing to measure, leaving the
 * caller's own fallback in charge rather than inventing an extent.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing computeModelRestExtent measures drawn geometry in model space on all three axes so landmark framing uses the subject's visible horizontal extent as well as its vertical one.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations computeModelRestExtent realizes landmark-based framing: A model's rest-pose box in model space: the axis-aligned range of the geometry a renderer would actually draw, on all three axes. computeModelRestExtentY is this measurement read on one axis, and the two are the same traversal for the reason the vertical one gives: every part is placed the way the renderer places it, and primitives are measured through tessellate, the code that produces the vertices, so the extent cannot drift from the picture. The horizontal half is what a subject wider than it is tall is framed and graded from. A figure is taller than it is wide at every shot size, so its width never decides its distance; a building element is the opposite, and a 60 m facade authored outward from its element origin has a drawn box of x 0…60, y 0…24, z −1…1 where the vertical read alone reports only y 0…24. Returns null when a model has nothing to measure, leaving the caller's own fallback in charge rather than inventing an extent.
 */
export const computeModelRestExtent = (
  model: IAutoMovieModel,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  const frames =
    model.skeleton === null ? null : restWorldFrames(model.skeleton);
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const part of model.parts) {
    const positions =
      part.geometry.type === "primitive"
        ? tessellate(part.geometry.shape).positions
        : part.geometry.mesh.positions;
    const local = part.transform;
    const frame =
      part.attachedBone === null ? undefined : frames?.get(part.attachedBone);
    for (let index = 0; index + 2 < positions.length; index += 3) {
      const point: IAutoMovieVector3 = {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      };
      const placed =
        local === null ? point : placeTransformedPoint(local, point);
      const world =
        frame === undefined
          ? placed
          : Vector3.add(frame.pos, Quaternion.rotateVector(frame.rot, placed));
      if (world.x < min.x) min.x = world.x;
      if (world.y < min.y) min.y = world.y;
      if (world.z < min.z) min.z = world.z;
      if (world.x > max.x) max.x = world.x;
      if (world.y > max.y) max.y = world.y;
      if (world.z > max.z) max.z = world.z;
    }
  }
  return min.y === Infinity ? null : { min, max };
};
