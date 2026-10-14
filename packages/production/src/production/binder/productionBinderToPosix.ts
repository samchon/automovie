/**
 * Normalize a relative inventory pathname to slash spelling for deterministic ordering.
 *
 * @evidence contracts/common.md#principled-implementation Replaces native backslash spelling with slash in already relative inventory paths, providing one ordering representation across supported hosts.
 * @evidence contracts/common.md#clear-and-simple-design Keeps display/order normalization separate from lexical containment or physical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization grants no ownership or safe-path verdict and does not repair escaping paths.
 * @evidence contracts/common.md#meaningful-documentation States relative-path presentation purpose and transformation without implying a filesystem move.
 * @evidence contracts/performance.md#efficient-algorithms Replacement scans path length and may allocate one normalized string, with no directory traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The inventory stores this one normalized pathname for its final sort and later path-component reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the string transfers and no handle, task or path cache is acquired.
 */
export function productionBinderToPosix(value: string): string {
    return value.replaceAll("\\", "/");
}
