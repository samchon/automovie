/**
 * Admit a non-array object whose own enumerable string keys match the required and optional key sets. Required keys use Object.hasOwn, so prototype inheritance cannot satisfy presence; symbols and nonenumerable extra properties remain outside enumeration.
 *
 * @evidence contracts/common.md#principled-implementation Object shape guards precede own required-key checks and allowed membership for each enumerable string key, preserving the metadata schema's exact-key policy.
 * @evidence contracts/common.md#clear-and-simple-design One identity-family predicate serves runtime, provenance and adoption without interpreting member values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited required keys fail; nonenumerable/symbol extras and effectful getters are not fully admitted by this enumerable-key policy.
 * @evidence contracts/common.md#meaningful-documentation Prose states non-array object admission, optional omission and the exact own/enumerable key boundary.
 * @evidence contracts/performance.md#efficient-algorithms K actual, R required and O optional names cost O(R+K*(R+O)) membership work plus one K-key array; identity schemas use small fixed key sets.
 * @evidence contracts/performance.md#reuse-equivalent-work The actual key array serves all allowed-key checks for this object; no cached shape survives mutable object changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; key arrays are local and no supplied object or schema array is retained.
 */
export const productionRepaintIdentityHasExactKeys: (value: unknown, keys: readonly string[], optional?: readonly string[]) => boolean = (
  value: unknown,
  keys: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const actual: string[] = Object.keys(value);
  return (
    keys.every((key: string): boolean => Object.hasOwn(value, key)) &&
    actual.every((key: string): boolean => keys.includes(key) || optional.includes(key))
  );
};
