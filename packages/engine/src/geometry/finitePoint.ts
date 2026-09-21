import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Admits finite two-dimensional metric construction coordinates.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits finite two-dimensional metric construction coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite profile operands before geometry is constructed.
 */
export const finitePoint = (
  point: IAutoMovieProfilePoint,
  label: string,
): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error(`${label} must be finite`);
};
