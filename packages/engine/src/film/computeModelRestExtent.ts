import {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { tessellate } from "../geometry/tessellate";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { placeTransformedPoint } from "./placeTransformedPoint";
import { skeletonRestFrames } from "./skeletonRestFrames";

/**
 * A model's rest-pose box in model space: the axis-aligned range, in metres, of
 * the geometry a renderer draws, on all three axes.
 *
 * Every vertex is placed the way the renderer places it: by its part's own
 * transform through {@link placeTransformedPoint}, then by the rest frame of
 * the bone the part rides, or left in model space when it rides none.
 * Primitives are measured through {@link tessellate}, the code that produces
 * their vertices, so the extent cannot drift from the picture. A trailing
 * partial `x, y, z` triple in a mesh is ignored.
 *
 * {@link computeModelRestExtentY} is this box read on the vertical axis. The
 * horizontal half is what a subject wider than it is tall is framed and graded
 * from: a 60 m facade authored outward from its element origin has a drawn box
 * of `x 0…60, y 0…24, z −1…1`, where the vertical read alone reports `y 0…24`.
 *
 * Returns null when no part has a vertex, leaving the caller's own fallback in
 * charge rather than inventing an extent. Throws, through
 * {@link skeletonRestFrames}, when the model's skeleton is malformed.
 *
 * @evidence contracts/common.md#principled-implementation A running axis-aligned min and max over every vertex after the renderer's placement, part TRS then the bone's composed rest frame at unit scale; it relies on model validation having bound every `attachedBone` to a bone of the model's own skeleton, so a part found on no frame is one that rides no bone.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared pieces, `tessellate` for primitives, `placeTransformedPoint` for the part transform that `nodeSubjectBox` also applies, and `skeletonRestFrames` for the bone frames `computeRestHeight` reads, and owns only the bound accumulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model, part kind or bone is special-cased; an empty model answers null by the stated rule instead of a stand-in box, and the subject-height default belongs to the callers.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, the per-vertex placement order and its sources, the partial-triple rule, the vertical reading, why the horizontal extent matters, the null case and the throwing case.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the drawn vertex count V plus one O(B) rest-frame walk for B bones and one tessellation per primitive part; the bounds stream in constant extra space rather than collecting placed points.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement of one model that coordinates nothing across calls; a pass that frames the same model for many subjects owns any memoization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; each tessellation and the rest-frame map are dropped as the call proceeds, and the caller owns the two returned vectors.
 */
export const computeModelRestExtent = (
  model: IAutoMovieModel,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  const frames: ReadonlyMap<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieTransform, "translation" | "rotation">
  > | null = model.skeleton === null ? null : skeletonRestFrames(model.skeleton);
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const part of model.parts) {
    const positions: readonly number[] =
      part.geometry.type === "primitive"
        ? tessellate(part.geometry.shape).positions
        : part.geometry.mesh.positions;
    const local: IAutoMovieTransform | null = part.transform;
    const frame:
      | Pick<IAutoMovieTransform, "translation" | "rotation">
      | undefined =
      part.attachedBone === null ? undefined : frames?.get(part.attachedBone);
    for (let index: number = 0; index + 2 < positions.length; index += 3) {
      const point: IAutoMovieVector3 = {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      };
      const placed: IAutoMovieVector3 =
        local === null ? point : placeTransformedPoint(local, point);
      const drawn: IAutoMovieVector3 =
        frame === undefined
          ? placed
          : Vector3.add(
              frame.translation,
              Quaternion.rotateVector(frame.rotation, placed),
            );
      if (drawn.x < min.x) min.x = drawn.x;
      if (drawn.y < min.y) min.y = drawn.y;
      if (drawn.z < min.z) min.z = drawn.z;
      if (drawn.x > max.x) max.x = drawn.x;
      if (drawn.y > max.y) max.y = drawn.y;
      if (drawn.z > max.z) max.z = drawn.z;
    }
  }
  return min.y === Infinity ? null : { min, max };
};
