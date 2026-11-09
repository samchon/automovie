/**
 * Require a non-null non-array JSON record at its owning path.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Runtime type and null/array exclusions establish an object shape before fields are read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared JSON record gate keeps identical error semantics across structural, payload and profile consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value is cast into a usable record until the object predicate succeeds, and malformed inputs are not repaired.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies accepted shape, path-named failure and returned borrowed identity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Object shape admission uses constant-time predicates rather than copying or traversing properties.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every optional-object path delegates this same gate for present values.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The helper returns the existing object and retains no metadata, payload or resource state.
 */
export const object: (
  value: unknown,
  path: string,
) => Record<string, unknown> = (
  value: unknown,
  path: string,
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
};
