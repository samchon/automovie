/**
 * Admits a source coordinate only when every required component is a finite number.
 * JSON null is rejected explicitly, including nonfinite values serialized by old tools.
 *
 * @evidence contracts/common.md#principled-implementation Checks coordinate dimensionality and Number.isFinite on each original component without numeric coercion.
 * @evidence contracts/common.md#clear-and-simple-design One admission rule serves inherited hand coordinates and planes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null, missing and nonnumeric components are never converted to zero.
 * @evidence contracts/common.md#meaningful-documentation States the serialized-nonfinite failure the admission prevents.
 * @evidence contracts/performance.md#efficient-algorithms Checks a fixed two- or three-component coordinate in constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the supplied coordinate without copying or loading source data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no external resource or retained state.
 */
export function finiteHandPoint(value: unknown, dimensions: 2 | 3): boolean {
  return (
    Array.isArray(value) &&
    value.length === dimensions &&
    value.every(
      (component: unknown): boolean =>
        typeof component === "number" && Number.isFinite(component),
    )
  );
}
