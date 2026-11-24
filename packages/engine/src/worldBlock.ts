import {
  IAutoMovieModel,
  type IAutoMovieWorldBlock,
} from "@automovie/interface";

import { Transform } from "./math/Transform";
import { srgbHexToLinearColor } from "./math/srgbHexToLinearColor";
import { productionRuntimeModelId } from "./productionRuntimeModelId";

/**
 * Build a box model group, placed node and bounds from a grounded base and
 * size.
 */
export const worldBlock: (
  input: IAutoMovieWorldBlock.IInput,
) => IAutoMovieWorldBlock = (
  input: IAutoMovieWorldBlock.IInput,
): IAutoMovieWorldBlock => {
  for (const [name, value] of Object.entries(input.size))
    if (value <= 0)
      throw new Error(
        `World block "${input.id}" size.${name} must be positive.`,
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
          y: input.base.y + input.size.y / 2,
          z: input.base.z,
        },
        { x: 0, y: 0, z: 0, w: 1 },
      ),
      motion: null,
      pose: null,
    },
    bounds: {
      min: {
        x: input.base.x - input.size.x / 2,
        y: input.base.y,
        z: input.base.z - input.size.z / 2,
      },
      max: {
        x: input.base.x + input.size.x / 2,
        y: input.base.y + input.size.y,
        z: input.base.z + input.size.z / 2,
      },
    },
  };
};

