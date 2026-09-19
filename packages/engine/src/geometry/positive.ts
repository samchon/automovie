/**
 * Admits strictly positive physical dimensions for geometry operations.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Admits strictly positive physical dimensions for geometry operations.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite or nonpositive extents before allocating procedural surfaces.
 */
export const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
