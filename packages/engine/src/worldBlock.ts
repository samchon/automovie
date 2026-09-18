import { IAutoMovieModelRecipe, IAutoMovieVector3 } from "@automovie/interface";
import { productionRuntimeModelId } from "./productionRuntimeModelId";
import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";

/**
 * Build one box-proxy wall or building from a grounded base and size.
 *
 * The emitted recipe names an archetype the production must have registered. It
 * defaults to the shipped `primitive-prop` builder and its `box` shape, because
 * that is what this helper's parameters describe; a production whose catalogue
 * spells the same static primitive differently passes its own id.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Converts the project's chosen identity, role, primitive dimensions, palette, and placement into one source-owned block record.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Validates every authored input and emits the recipe, node, and bounds needed by downstream compilation.
 */
export const worldBlock = (input: {
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
