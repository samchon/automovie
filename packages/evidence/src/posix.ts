

/**
 * Replace backslash separators with forward slashes without changing other path characters.
 *
 * @evidence contracts/common.md#principled-implementation Replace backslash separators with forward slashes without changing other path characters.
 * @evidence contracts/common.md#clear-and-simple-design Canonical graph addresses use a single separator spelling on Windows and POSIX.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation does not prove confinement or normalize dot segments; physical boundary validation remains separate.
 * @evidence contracts/common.md#meaningful-documentation The result can still be absolute or relative according to the supplied path.
 * @evidence contracts/performance.md#efficient-algorithms Replacement scans the path and allocates at most one normalized string.
 * @evidence contracts/performance.md#reuse-equivalent-work All route consumers reuse the same separator conversion instead of locale-dependent path display.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No path cache or file handle is owned by this conversion.
 */
export function posix(value: string): string {
  return value.replaceAll("\\", "/");
}
