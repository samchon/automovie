import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Admits finite three-dimensional metric construction coordinates.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits finite three-dimensional metric construction coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite path or placement operands before geometry is constructed.
 */
export const finiteVector = (point: IAutoMovieVector3, label: string): void => {
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error(`${label} must be finite`);
};
