

/**
 * Recognize a safe integer inside a zero-based inventory.
 *
 * Number type, safe-integer identity and half-open bounds determine resolvable node or array references.
 *
 * @evidence contracts/common.md#principled-implementation Number type, safe-integer identity and half-open bounds determine resolvable node or array references.
 * @evidence contracts/common.md#clear-and-simple-design The boolean predicate separates recognition from integerIndex's field-specific throwing behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonnumeric, negative, fractional and unsafe values remain false without coercion or fallback.
 * @evidence contracts/common.md#meaningful-documentation Prose states accepted bounds, safe precision and the nonthrowing recognition role.
 * @evidence contracts/performance.md#efficient-algorithms Four scalar predicates cost constant time independent of inventory size.
 * @evidence contracts/performance.md#reuse-equivalent-work Throwing index admission and VRM mapping reuse the same recognition semantics.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate retains no inventory references and acquires no resource.
 * @author Samchon
 */
export const validNodeIndex: (value: unknown, length: number) => boolean = (value: unknown, length: number): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value < length;
