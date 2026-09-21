/**
 * Whether a value is a non-null, non-array JSON object.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `isRecord` distinguishes structured artifact members from null, arrays, and primitive values before geometry fields are inspected.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `isRecord` establishes the object-shape precondition for member-level numeric and structural checks.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
