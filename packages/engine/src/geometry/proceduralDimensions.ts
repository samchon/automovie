/**
 * Common numerical admission for procedural builders and rigid placement.
 * Metric points/vectors must be finite, positive dimensions remain strictly
 * positive, and sampling counts are safe integers above the caller's minimum.
 * These checks neither coerce inputs nor mutate them. Callers provide a label
 * naming the operand so a refusal remains attributable before buffer creation.
 */
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieProfilePoint } from "./proceduralMeshTypes";

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

/**
 * Admits finite three-dimensional metric construction coordinates.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits finite three-dimensional metric construction coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite path or placement operands before geometry is constructed.
 */
export const finiteVector = (point: IAutoMovieVector3, label: string): void => {
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error(`${label} must be finite`);
};

/**
 * Admits strictly positive physical dimensions for geometry operations.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits strictly positive physical dimensions for geometry operations.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite or nonpositive extents before allocating procedural surfaces.
 */
export const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};

/**
 * Admits meaningful discrete sampling counts for procedural geometry.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits meaningful discrete sampling counts for procedural geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Requires a safe integer count at least as large as the operation minimum.
 */
export const countAtLeast = (
  value: number,
  least: number,
  label: string,
): void => {
  if (!Number.isSafeInteger(value) || value < least)
    throw new Error(`${label} must be a safe integer >= ${least}`);
};
