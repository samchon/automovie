/**
 * Require a nonempty project-relative POSIX path with canonical segments.
 *
 * @evidence contracts/common.md#principled-implementation Rejects backslashes, leading slash, drive-letter prefixes and empty/dot/dot-dot segments using lexical string checks.
 * @evidence contracts/common.md#clear-and-simple-design Shares one spelling rule across emitter, source, dependency and output record paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is lexical admission, not realpath, existence, symlink containment or filesystem access validation; values remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation Documents the exact rejected path spellings and generic Error cause.
 * @evidence contracts/performance.md#efficient-algorithms Scans path characters and segments in linear text work, allocating the split segment array.
 * @evidence contracts/performance.md#reuse-equivalent-work Every supplied path is checked anew; no filesystem or validity cache is consulted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary segments and the caller-owned path/error text outlive no owned file handle or task.
 */
export function assertRelativePath(value: string): void {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    value
      .split("/")
      .some((part: string): boolean => part === "" || part === "." || part === "..")
  )
    throw new Error(
      `Design derivation path "${value}" is not a canonical project-relative POSIX path.`,
    );
}
