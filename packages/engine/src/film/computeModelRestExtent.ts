import {
  AutoMovieHumanoidBone,
  type IAutoMovieComputeModelRestExtent,
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { realizeAutoMovieGeometry } from "../geometry/realizeAutoMovieGeometry";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { placeTransformedPoint } from "./placeTransformedPoint";
import { skeletonRestFrames } from "./skeletonRestFrames";

/**
 * A model's rest-pose box in model space: the axis-aligned range, in metres, of
 * its portable part geometry, on all three axes. External asset bytes are not
 * opened here, so proxy parts do not establish the imported asset's pixel
 * extent.
 *
 * Every vertex is placed the way the renderer places it: by its part's own
 * transform through {@link placeTransformedPoint}, then by the rest frame of the
 * bone the part rides, or left in model space when it rides none. The canonical
 * geometry realizer supplies primitive and bicubic recipe vertices, retaining
 * finite partial output, so framing does not reject an otherwise displayable
 * recipe. A trailing partial `x, y, z` triple in a mesh is ignored.
 *
 * {@link computeModelRestExtentY} is this box read on the vertical axis. The
 * horizontal half is what a subject wider than it is tall is framed and graded
 * from: a 60 m facade authored outward from its element origin has a drawn box
 * of `x 0…60, y 0…24, z −1…1`, where the vertical read alone reports `y 0…24`.
 *
 * Returns null when no part has a vertex, leaving the caller's own fallback in
 * charge rather than inventing an extent. Throws, through
 * {@link skeletonRestFrames}, when the model's skeleton is malformed.
 */
export function computeModelRestExtent(
  model: IAutoMovieModel,
): IAutoMovieComputeModelRestExtent.IResult {
  const frames: ReadonlyMap<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieTransform, "translation" | "rotation">
  > | null =
    model.skeleton === null ? null : skeletonRestFrames(model.skeleton);
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const part of model.parts) {
    const positions: readonly number[] = realizeAutoMovieGeometry(part.geometry)
      .mesh.positions;
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
}
