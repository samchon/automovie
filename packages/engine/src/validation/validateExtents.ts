import type {
  IAutoMoviePrimitiveShape,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Switch on primitive shape and require finite positive supported dimensions,
 * including capsule length policy.
 */
export function validateExtents(
  shape: IAutoMoviePrimitiveShape,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
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
  }
  for (const [name, value] of dims)
    if (value <= 0)
      collector.push(
        "range",
        `${path}.${name}`,
        `${name} must be a finite number > 0, but was ${value}`,
        value,
      );
}
