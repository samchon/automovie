/**
 * Compare exact plain source values without serializing large geometry arrays. Object key order carries no source meaning; array order and every scalar do. Actual body source records are plain JSON values admitted by their schema.
 *
 * @evidence contracts/common.md#principled-implementation Object.is preserves exact scalar identity, ordered array elements and hole incidence compare recursively, and own object keys compare independently of insertion order.
 * @evidence contracts/common.md#clear-and-simple-design Scalar, array and plain-record branches keep source equivalence readable without constructing serialized copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contract is admitted acyclic plain JSON source, not arbitrary prototypes, accessors, symbols or cycles; this comparison does not admit or repair such inputs.
 * @evidence contracts/common.md#meaningful-documentation Exact scalars, meaningful array order, irrelevant object key order and the schema-admitted source premise are stated.
 * @evidence contracts/performance.md#efficient-algorithms Equal acyclic records require one recursive scalar/key traversal with early exit on mismatch; key arrays consume memory per active object and recursion depth remains a stack limit for unusually deep source trees.
 * @evidence contracts/performance.md#reuse-equivalent-work Object.is returns immediately for shared references and equal scalars; no persistent memoization is needed for the admitted tree comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; recursive frames and object-key arrays expire as traversal returns, and no cache or external resource retains source geometry.
 */
export function equalHumanBodySourceValue(
  left: unknown,
  right: unknown,
): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  )
    return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    )
      return false;
    for (let index: number = 0; index < left.length; index++)
      if (
        index in left !== index in right ||
        !equalHumanBodySourceValue(left[index], right[index])
      )
        return false;
    return true;
  }
  const leftKeys: string[] = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  for (const key of leftKeys)
    if (
      !Object.hasOwn(right, key) ||
      !equalHumanBodySourceValue(
        Reflect.get(left, key),
        Reflect.get(right, key),
      )
    )
      return false;
  return true;
}
