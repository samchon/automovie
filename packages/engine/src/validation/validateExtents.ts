import { AutoMoviePrimitiveShape } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Switch on primitive shape and require finite positive supported dimensions, including capsule length policy.
 *
 * @evidence contracts/common.md#principled-implementation Switch on primitive shape and require finite positive supported dimensions, including capsule length policy.
 * @evidence contracts/common.md#clear-and-simple-design Shape-specific dimensions belong here while collector scalar predicates provide their diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown shapes report a type fault; dimensions are not clamped or replaced by defaults.
 * @evidence contracts/common.md#meaningful-documentation Dimension paths and strictly-positive model-unit requirements are stated.
 * @evidence contracts/performance.md#efficient-algorithms The closed shape menu and fixed fields give constant arithmetic/text work.
 * @evidence contracts/performance.md#reuse-equivalent-work Primitive model/affordance gates share these rules instead of their own extents validators.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only collector rows remain with the caller; no mesh tessellation or renderer resource is acquired.
 */
export const validateExtents: (shape: AutoMoviePrimitiveShape, path: string, collector: ViolationCollector) => void = (
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
      const unknown: { type: unknown; } = shape as { type: unknown };
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
