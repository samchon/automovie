import { AutoMoviePrimitiveShape } from "@automovie/interface";
import { ITessellation } from "./ITessellation";

/**
 * Tessellate a {@link AutoMoviePrimitiveShape} into a triangle mesh.
 *
 * Lets the LLM-authored "named dimensions" path (a 0.4 m sphere, a capsule)
 * become concrete geometry a renderer can draw, without the model ever emitting
 * vertices. The engine owns this so generated primitives render identically
 * everywhere.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Converts named primitive dimensions into concrete geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Implements the native primitive-input path of the geometry contract.
 * @author Samchon
 */
export const tessellate = (shape: AutoMoviePrimitiveShape): ITessellation => {
  switch (shape.type) {
    case "box":
      return box(shape.width, shape.height, shape.depth);
    case "plane":
      return box(shape.width, 0, shape.depth);
    case "sphere":
      return sphere(shape.radius, 16, 12);
    case "cylinder":
      return cylinder(shape.radius, shape.radius, shape.height, 16);
    case "cone":
      return cylinder(shape.radius, 0, shape.height, 16);
    case "capsule":
      // Approximate a capsule by its closed bounding cylinder for now (the
      // SPHERICAL end caps are a future refinement); height spans body + both
      // radii.
      return cylinder(
        shape.radius,
        shape.radius,
        shape.height + 2 * shape.radius,
        16,
      );
    default: {
      const unknown = shape as unknown as { type: unknown };
      throw new Error(`unknown primitive shape "${String(unknown.type)}"`);
    }
  }
};
