/**
 * Read own JSON data fields without trusting a locally rejected declaration.
 * Missing fields, scalar parents and accessor properties produce undefined;
 * no prototype property or getter supplies a saved coefficient identity.
 * Numerical owners still admit their original inputs independently.
 *
 * @evidence contracts/common.md#principled-implementation Own data descriptors preserve literal JSON identities while malformed parents remain unknown.
 * @evidence contracts/common.md#clear-and-simple-design One field-path reader is shared by lifecycle and membership metadata consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing metadata is not repaired, coerced, inferred from position or used to replace geometry.
 * @evidence contracts/common.md#meaningful-documentation States own-field semantics, unknown results and separation from numerical admission.
 * @evidence contracts/performance.md#efficient-algorithms A path of D keys costs O(D) time and O(1) auxiliary space; callers use fixed short paths.
 * @evidence contracts/performance.md#reuse-equivalent-work No mesh traversal or numerical generation occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a borrowed field value is returned; no cache, getter, handle or listener is retained.
 */
export function readRecoveryMetadata(
  value: unknown,
  keys: readonly string[],
): unknown {
  let current: unknown = value;
  for (const key of keys) {
    if (current === null || typeof current !== "object") return undefined;
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(current, key);
    if (descriptor === undefined || !("value" in descriptor)) return undefined;
    current = descriptor.value;
  }
  return current;
}
