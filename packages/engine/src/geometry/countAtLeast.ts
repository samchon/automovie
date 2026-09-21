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
