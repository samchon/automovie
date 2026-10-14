import { IAutoMovieModelRecipe, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { productionRuntimeModelId } from "./productionRuntimeModelId";

/**
 * Build a box-proxy recipe, placed node and bounds from a grounded base and size.
 *
 * @evidence contracts/common.md#principled-implementation Half-extents around the base XZ and baseY plus half-height place the same box dimensions carried by the primitive-prop recipe; runtime identity uses the canonical model-id owner. Finite input fields do not universally keep derived additions representable.
 * @evidence contracts/common.md#clear-and-simple-design One constructor joins recipe, node and bounds while archetype registration/materialization remain with the production; the optional archetype id selects a registered spelling rather than another geometry method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank id, nonpositive/nonfinite enumerated sizes, nonfinite base and non-hex color throw before output. Typed vector shape is a premise; missing fields and arbitrary archetype ids are not total unknown-payload admission here.
 * @evidence contracts/common.md#meaningful-documentation Documents metre base/size, centered box placement, #RRGGBB palette, default primitive-prop and fresh result ownership; the helper itself has test-only repository reach.
 * @evidence contracts/performance.md#efficient-algorithms For fixed vector fields, arithmetic and output size are constant plus id/color string work; declared box volume does not allocate geometry or render resources.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied dimensions feed recipe, translation and bounds within the call; no cheap scalar result cache or separately tunable extent is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh recipe/node/bounds records, which retain scalar strings only; no builder registry, model instance, renderer or background task is acquired.
 * @author Samchon
 */
export const worldBlock: (input: {
  id: string;
  kind: "wall" | "building";
  base: IAutoMovieVector3;
  size: IAutoMovieVector3;
  color: string;
  archetype?: string | undefined;
}) => IAutoMovieWorldBlock = (input: {
  id: string;
  kind: IAutoMovieWorldBlock["kind"];
  base: IAutoMovieVector3;
  size: IAutoMovieVector3;
  color: string;
  archetype?: string;
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
  const recipe: IAutoMovieModelRecipe = {
    id: input.id,
    role: "set",
    archetype: input.archetype ?? "primitive-prop",
    parameters: {
      shape: "box",
      width: input.size.x,
      height: input.size.y,
      depth: input.size.z,
    },
    palette: { structure: input.color },
    lod: [{ tier: "near", maxDistance: null, recipe: input.id }],
    capabilities: [],
    attachments: [],
  };
  return {
    id: input.id,
    kind: input.kind,
    recipe,
    node: {
      id: input.id,
      model: productionRuntimeModelId(input.id),
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
