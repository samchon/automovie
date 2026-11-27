import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { realizeGeometry } from "../../geometry/internal/realizeGeometry";
import { AutoMovieEngineMatrix4 } from "../../math/AutoMovieEngineMatrix4";

/*
 * One world box per drawn part of one placed element, in the model's part
 * order, or the element's world origin as a single degenerate box when it draws
 * no vertex.
 *
 * Each part is placed for this CPU measurement under its own transform and then
 * under the element's world matrix. The canonical geometry realizer supplies
 * primitive or bicubic vertices and borrows stated mesh vertices, retaining
 * finite partial recipe output. A part with no vertex adds no box. A model the
 * environment does not hold is `undefined`, because a runtime model reference
 * is a legal way to furnish a building whose bytes the record never carries;
 * such an element, and one whose parts draw nothing, keeps its origin so the
 * answer still says where the record put it.
 *
 * The union of the returned boxes is the element's whole world box, so the
 * per-element union query and the per-part queries read one measurement.
 *
 * These are CPU boxes of finite stated or tessellated vertices under
 * element-world and part-local TRS. Attached-bone transforms, skinning,
 * animation, loaded external geometry and GPU Float32 evaluation are outside
 * this measurement; enclosure of a rendered frame requires those extra effects
 * to be absent or separately bounded.
 */
export function builtPlacedPartBoxes(
  model: IAutoMovieModel | undefined,
  world: number[],
): IAutoMovieSubjectBox[] {
  const boxes: IAutoMovieSubjectBox[] = [];
  for (const part of model?.parts ?? []) {
    const box: IAutoMovieSubjectBox | null = placedPartBox(part, world);
    if (box !== null) boxes.push(box);
  }
  if (boxes.length !== 0) return boxes;
  const origin: IAutoMovieVector3 = AutoMovieEngineMatrix4.position(world);
  return [{ min: { ...origin }, max: { ...origin } }];
}

/*
 * The world box one drawn part fills, or null when it has no vertex.
 */
const placedPartBox: (
  part: IAutoMovieModelPart,
  world: number[],
) => IAutoMovieSubjectBox | null = (
  part: IAutoMovieModelPart,
  world: number[],
): IAutoMovieSubjectBox | null => {
  const positions: readonly number[] = realizeGeometry(part.geometry)
    .mesh.positions;
  if (positions.length < 3) return null;
  const m: number[] =
    part.transform === null
      ? world
      : AutoMovieEngineMatrix4.multiply(
          world,
          AutoMovieEngineMatrix4.compose(
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
