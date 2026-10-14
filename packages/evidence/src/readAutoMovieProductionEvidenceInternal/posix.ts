


/** Use POSIX separators in every project-relative public identity.
 *
 * @evidence contracts/common.md#principled-implementation Backslash separators are replaced with slashes for project-relative public identities.
 * @evidence contracts/common.md#clear-and-simple-design The controlled population selector converts admitted glob-intersection results into project-relative public identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The conversion does not claim path admission or physical-root validation; those remain owning operations.
 * @evidence contracts/common.md#meaningful-documentation The comment states public project-relative separator form.
 * @evidence contracts/performance.md#efficient-algorithms For L characters, replacement is O(L) and produces at most one new string.
 * @evidence contracts/performance.md#reuse-equivalent-work The controlled population selector shares this separator conversion without retaining previous path results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result string escapes; no path population or handle is retained.
 */
export const posix: (value: string) => string = (value: string): string => value.replaceAll("\\", "/");
