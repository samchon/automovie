/**
 * A value as an array, or an empty one: shape errors are reported separately.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `asArray` limits element traversal to actual arrays after a separate shape fault has identified a malformed collection.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `asArray` supplies the empty traversal fallback that prevents invalid collection shapes from creating invented member observations.
 */
export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
