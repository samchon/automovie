/**
 * A value as an array, or an empty one: shape errors are reported separately.
 */
export const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
