/*
 * Read a finite numeric tuple with a glTF default when omitted.
 *
 * Undefined copies the caller's fallback without validating it; motion-node
 * callers supply finite three- or four-component glTF defaults. Present arrays
 * must have the same length and finite numeric entries, or throw with the
 * field/index path. Both branches return a fresh array.
 */
export function finiteTuple(
  value: unknown,
  path: string,
  fallback: readonly number[],
): number[] {
  if (value === undefined) return [...fallback];
  if (Array.isArray(value) === false || value.length !== fallback.length)
    throw new Error(
      `${path} must contain exactly ${fallback.length} finite numbers.`,
    );
  return (value as unknown[]).map((entry: unknown, index: number): number => {
    if (typeof entry !== "number" || Number.isFinite(entry) === false)
      throw new Error(`${path}[${index}] must be finite.`);
    return entry;
  });
}
