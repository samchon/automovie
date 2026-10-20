import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { srgbHexToLinearColor } from "./math/srgbHexToLinearColor";
import { productionRuntimeModelId } from "./productionRuntimeModelId";

/**
 * Build a box model group, placed node and bounds from a grounded base and size.
 *
 * @evidence contracts/common.md#principled-implementation Half-extents around the base XZ and baseY plus half-height place the same box dimensions the model's single part draws; the color is decoded from sRGB to linear by the shared decoder, and runtime identity uses the canonical model-id owner. Finite input fields do not universally keep derived additions representable.
 * @evidence contracts/common.md#clear-and-simple-design One constructor joins model, node and bounds from the same size; the box model is built in place because `engine` cannot depend on the archetype catalogue, and it carries no LOD or registry indirection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank id, nonpositive/nonfinite enumerated sizes, nonfinite base and non-hex color throw before output. Typed vector shape is a premise; missing fields are not total unknown-payload admission here.
 * @evidence contracts/common.md#meaningful-documentation Documents metre base/size, centered box placement, the #RRGGBB color decoded into one material, the shared runtime model id and fresh result ownership; the helper itself has test-only repository reach.
 * @evidence contracts/performance.md#efficient-algorithms For fixed vector fields, arithmetic and output size are constant plus id/color string work; the box is one primitive part, so declared volume allocates no mesh or render resources.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied dimensions feed the part, translation and bounds within the call; no cheap scalar result cache or separately tunable extent is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh model/node/bounds records; no builder registry, renderer or background task is acquired.
 */
export const worldBlock: (input: {
  id: string;
  kind: "wall" | "building";
  base: IAutoMovieVector3;
  size: IAutoMovieVector3;
  color: string;
}) => IAutoMovieWorldBlock = (input: {
  id: string;
  kind: IAutoMovieWorldBlock["kind"];
  base: IAutoMovieVector3;
  size: IAutoMovieVector3;
  color: string;
}): IAutoMovieWorldBlock => {
  assertText(input.id, "World block id");
  for (const [name, value] of Object.entries(input.size))
    if (Number.isFinite(value) === false || value <= 0)
      throw new Error(
        `World block "${input.id}" size.${name} must be positive.`,
      );
  assertVector(input.base, `World block "${input.id}" base`);
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
      transform: {
        translation: {
          x: input.base.x,
          y: input.base.y + input.size.y / 2,
          z: input.base.z,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
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

/** Require non-whitespace id text without rewriting its spelling or certifying displayed visibility. */
const assertText: (value: string, field: string) => void = (
  value: string,
  field: string,
): void => {
  if (value.trim().length === 0)
    throw new Error(`${field} must contain non-whitespace text.`);
};

/** Refuse a nonfinite base component before grounded-box arithmetic. */
const assertVector: (value: IAutoMovieVector3, field: string) => void = (
  value: IAutoMovieVector3,
  field: string,
): void => {
  if ([value.x, value.y, value.z].every(Number.isFinite) === false)
    throw new Error(`${field} must be finite.`);
};
