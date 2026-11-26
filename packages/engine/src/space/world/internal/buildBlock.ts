import type {
  IAutoMovieModel,
  IAutoMovieWorldBlock,
} from "@automovie/interface";

import { AUTOMOVIE_SUPPORT_TOLERANCE } from "../../../architecture/constants/AUTOMOVIE_SUPPORT_TOLERANCE";
import { Transform } from "../../../math/Transform";
import { srgbHexToLinearColor } from "../../../math/internal/srgbHexToLinearColor";
import { productionRuntimeModelId } from "../../../model/internal/productionRuntimeModelId";

/**
 * Build a box model group, placed node and bounds from a grounded base and
 * size. Each span of the resulting world bounds must be positive and
 * representable at the block's placed coordinates. Its Y center must also
 * remain inside both vertical bounds. The computed bottom must stay within
 * building contact precision of the authored base.
 */
export function buildBlock(
  input: IAutoMovieWorldBlock.IInput,
): IAutoMovieWorldBlock {
  for (const [name, value] of Object.entries(input.size))
    if (value <= 0)
      throw new Error(
        `World block "${input.id}" size.${name} must be positive.`,
      );
  const halfHeight: number = input.size.y / 2;
  const centerY: number = input.base.y + halfHeight;
  const bounds: IAutoMovieWorldBlock["bounds"] = {
    min: {
      x: input.base.x - input.size.x / 2,
      y: centerY - halfHeight,
      z: input.base.z - input.size.z / 2,
    },
    max: {
      x: input.base.x + input.size.x / 2,
      y: centerY + halfHeight,
      z: input.base.z + input.size.z / 2,
    },
  };
  for (const axis of ["x", "y", "z"] as const) {
    const span: number = bounds.max[axis] - bounds.min[axis];
    if (!(span > 0 && span < Infinity))
      throw new Error(
        `World block "${input.id}" base must be finite and its bounds must span a representable positive distance on ${axis}.`,
      );
  }
  if (
    !(
      input.base.y < centerY &&
      centerY < input.base.y + input.size.y &&
      bounds.min.y < centerY &&
      centerY < bounds.max.y
    )
  )
    throw new Error(
      `World block "${input.id}" needs a representable center above its base and below its top.`,
    );
  if (Math.abs(bounds.min.y - input.base.y) > AUTOMOVIE_SUPPORT_TOLERANCE)
    throw new Error(
      `World block "${input.id}" cannot place its bottom within ${AUTOMOVIE_SUPPORT_TOLERANCE} m of its base.`,
    );
  if (/^#[0-9a-f]{6}$/i.test(input.color) === false)
    throw new Error(`World block "${input.id}" color must be #RRGGBB.`);
  const model: IAutoMovieModel = {
    id: productionRuntimeModelId(input.id),
    name: null,
    origin: "generated",
    parts: [
      {
        id: "primitive",
        name: "primitive",
        geometry: {
          type: "primitive",
          shape: {
            type: "box",
            width: input.size.x,
            height: input.size.y,
            depth: input.size.z,
          },
        },
        material: "structure",
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials: [
      {
        id: "structure",
        name: "structure",
        baseColor: srgbHexToLinearColor(input.color),
        metallic: 0,
        roughness: 0.7,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    asset: null,
  };
  return {
    id: input.id,
    kind: input.kind,
    model,
    node: {
      id: input.id,
      model: model.id,
      transform: Transform.of(
        {
          x: input.base.x,
          y: centerY,
          z: input.base.z,
        },
        { x: 0, y: 0, z: 0, w: 1 },
      ),
      motion: null,
      pose: null,
    },
    bounds,
  };
}
