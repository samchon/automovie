

/**
 * The predicate narrows a non-null non-array object; despite its internal name, it does not inspect prototypes.
 *
 * @evidence contracts/common.md#principled-implementation The predicate narrows a non-null non-array object; despite its internal name, it does not inspect prototypes.
 * @evidence contracts/common.md#clear-and-simple-design Manifest shape checks use it after JSON materialization, which supplies ordinary record objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No claim of plain-prototype admission is made for arbitrary direct callers or Proxy objects.
 * @evidence contracts/common.md#meaningful-documentation Documents the actual structural narrowing and persistent-JSON caller premise.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar/container tests cost constant work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh narrowing over the current value is cheaper than maintaining a verdict cache and preserves mutation visibility.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The boolean result retains no input object or handle.
 */
export const derivedArtifactIsPlainRecord: (value: unknown) => value is Record<string, unknown> = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && Array.isArray(value) === false;
