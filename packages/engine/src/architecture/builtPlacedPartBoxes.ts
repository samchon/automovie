import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";

/**
 * One world box per drawn part of one placed element, in the model's part
 * order, or the element's world origin as a single degenerate box when it draws
 * no vertex.
 *
 * Each part is placed the way the renderer places it, under its own transform
 * and then under the element's world matrix, and its vertices are read through
 * {@link tessellate} for a primitive and from the stated mesh otherwise. A part
 * with no vertex adds no box. A model the environment does not hold is
 * `undefined`, because a runtime model reference is a legal way to furnish a
 * building whose bytes the record never carries; such an element, and one
 * whose parts draw nothing, keeps its origin so the answer still says where
 * the record put it.
 *
 * The union of the returned boxes is the element's whole world box, so the
 * per-element union query and the per-part queries read one measurement.
 *
 * @evidence contracts/common.md#principled-implementation Folds every transformed vertex into a running minimum and maximum, which is the exact axis-aligned box of a finite point set; the transform is the column-major affine product `world · partTRS` the renderer applies, so the box encloses exactly what is drawn.
 * @evidence contracts/common.md#clear-and-simple-design One placement and tessellation rule shared by the element, part, part-sweep and space-content bounds queries, so how a part is measured lives in one file instead of four private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no model or part kind; the origin fallback for an unheld model or vertex-less parts is a stated rule that keeps the record's stated position, not an invented extent.
 * @evidence contracts/common.md#meaningful-documentation States the world frame, the part order, the renderer-matching placement, which vertices are read, when a part adds no box, the meaning of an `undefined` model, the origin fallback, and that the boxes' union is the element box.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed vertex count of the model's parts, folding each transformed vertex directly into its part's box without materializing a point array; primitives are tessellated once per part per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Tessellation is not cached across calls, because a primitive's shape is part of the caller's mutable record; callers that measure many elements resolve world matrices once and call this per element.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the boxes, one per part, and each tessellation is garbage once its part is folded.
 */
export const builtPlacedPartBoxes = (
  model: IAutoMovieModel | undefined,
  world: number[],
): IAutoMovieSubjectBox[] => {
  const boxes: IAutoMovieSubjectBox[] = [];
  for (const part of model?.parts ?? []) {
    const box: IAutoMovieSubjectBox | null = placedPartBox(part, world);
    if (box !== null) boxes.push(box);
  }
  if (boxes.length !== 0) return boxes;
  const origin: IAutoMovieVector3 = {
    x: world[12]!,
    y: world[13]!,
    z: world[14]!,
  };
  return [{ min: { ...origin }, max: { ...origin } }];
};

/** The world box one drawn part fills, or null when it has no vertex. */
const placedPartBox = (
  part: IAutoMovieModelPart,
  world: number[],
): IAutoMovieSubjectBox | null => {
  const positions: readonly number[] =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape).positions
      : part.geometry.mesh.positions;
  if (positions.length < 3) return null;
  const m: number[] =
    part.transform === null
      ? world
      : Matrix4.multiply(
          world,
          Matrix4.compose(
            part.transform.translation,
            part.transform.rotation,
            part.transform.scale,
          ),
        );
  const box: IAutoMovieSubjectBox = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  for (let index: number = 0; index + 2 < positions.length; index += 3) {
    const px: number = positions[index]!;
    const py: number = positions[index + 1]!;
    const pz: number = positions[index + 2]!;
    const x: number = m[0]! * px + m[4]! * py + m[8]! * pz + m[12]!;
    const y: number = m[1]! * px + m[5]! * py + m[9]! * pz + m[13]!;
    const z: number = m[2]! * px + m[6]! * py + m[10]! * pz + m[14]!;
    box.min.x = Math.min(box.min.x, x);
    box.min.y = Math.min(box.min.y, y);
    box.min.z = Math.min(box.min.z, z);
    box.max.x = Math.max(box.max.x, x);
    box.max.y = Math.max(box.max.y, y);
    box.max.z = Math.max(box.max.z, z);
  }
  return box;
};
