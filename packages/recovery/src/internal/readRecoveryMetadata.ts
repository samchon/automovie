/**
 * Read own JSON data fields without trusting a locally rejected declaration.
 * Missing fields, scalar parents and accessor properties produce undefined;
 * no prototype property or getter supplies a saved coefficient identity.
 * Numerical owners still admit their original inputs independently.
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
