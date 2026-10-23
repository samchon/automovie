import path from "node:path";

/**
 * Rejects non-canonical paths capable of escaping either compared root.
 *
 * @evidence contracts/common.md#principled-implementation Slash-normalize and require exact POSIX normalization, a relative Markdown suffix and no drive or dot segments.
 * @evidence contracts/common.md#clear-and-simple-design One validator serves both selected paths and sample identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Escaping or noncanonical paths throw instead of being repaired into another file.
 * @evidence contracts/common.md#meaningful-documentation The comment states root-escape protection; errors require normalized relative Markdown paths.
 * @evidence contracts/performance.md#efficient-algorithms Replacement, normalization and segment checks scale with path length and proportional temporary allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work Node normalization is reused as the primitive; independent paths are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local strings and arrays expire after return or throw; the path is caller-owned.
 */
export function normalizeFile(file: string): string {
  const slashed: string = file.replaceAll("\\", "/");
  const normalized: string = path.posix.normalize(slashed);
  if (
    slashed === "" ||
    normalized !== slashed ||
    path.posix.isAbsolute(normalized) ||
    /^[A-Za-z]:/u.test(normalized) ||
    normalized
      .split("/")
      .some((part: string): boolean => part === ".." || part === ".") ||
    !normalized.endsWith(".md")
  )
    throw new Error(`${file}: expected a normalized relative Markdown path.`);
  return normalized;
}
