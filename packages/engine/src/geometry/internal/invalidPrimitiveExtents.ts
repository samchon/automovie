import type { IAutoMoviePrimitiveShape } from "@automovie/interface";

type PrimitiveExtent = readonly [name: string, value: number];

/* Reports unsupported dimensions in the order they appear in the recipe. */
export function invalidPrimitiveExtents(
  shape: IAutoMoviePrimitiveShape,
): readonly PrimitiveExtent[] {
  return primitiveExtents(shape).filter(
    ([, value]: PrimitiveExtent): boolean =>
      !Number.isFinite(value) || value <= 0,
  );
}

function primitiveExtents(
  shape: IAutoMoviePrimitiveShape,
): readonly PrimitiveExtent[] {
  switch (shape.type) {
    case "box":
      return [
        ["width", shape.width],
        ["height", shape.height],
        ["depth", shape.depth],
      ];
    case "sphere":
      return [["radius", shape.radius]];
    case "plane":
      return [
        ["width", shape.width],
        ["depth", shape.depth],
      ];
    case "cylinder":
    case "cone":
    case "capsule":
      return [
        ["radius", shape.radius],
        ["height", shape.height],
      ];
    default:
      throw new TypeError("Unknown primitive shape type");
  }
}
