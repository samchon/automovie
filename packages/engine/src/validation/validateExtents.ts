import { ViolationCollector } from "./ViolationCollector";
import { AutoMoviePrimitiveShape } from "@automovie/interface";

/**
 * Push a `type` violation for an unknown primitive shape, or a `range`
 * violation for any non-finite or non-positive primitive dimension.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Selects the dimensions belonging to each primitive kind and diagnoses nonfinite or nonpositive extents.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Selects the dimensions belonging to each primitive kind and diagnoses nonfinite or nonpositive extents.
 */
export const validateExtents = (
  shape: AutoMoviePrimitiveShape,
  path: string,
  collector: ViolationCollector,
): void => {
  let dims: ReadonlyArray<readonly [string, number]>;
  switch (shape.type) {
    case "box":
      dims = [
        ["width", shape.width],
        ["height", shape.height],
        ["depth", shape.depth],
      ];
      break;
    case "sphere":
      dims = [["radius", shape.radius]];
      break;
    case "plane":
      dims = [
        ["width", shape.width],
        ["depth", shape.depth],
      ];
      break;
    case "cylinder":
    case "cone":
    case "capsule":
      dims = [
        ["radius", shape.radius],
        ["height", shape.height],
      ];
      break;
    default: {
      const unknown = shape as { type: unknown };
      collector.push(
        "type",
        `${path}.type`,
        `unknown primitive shape "${String(unknown.type)}"`,
        unknown.type,
      );
      return;
    }
  }
  for (const [name, value] of dims)
    if (!Number.isFinite(value) || value <= 0)
      collector.push(
        "range",
        `${path}.${name}`,
        `${name} must be a finite number > 0, but was ${value}`,
        value,
      );
};
