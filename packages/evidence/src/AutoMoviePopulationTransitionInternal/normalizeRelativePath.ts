import path from "node:path";


/**
 * Admit an already normalized project-relative host identity, returning its unchanged spelling.
 *
 * Empty, absolute, drive-prefixed, backslash-separated, aliased and parent-relative paths throw an Error naming the supplied path. This operation checks addressing syntax without opening a pathname.
 *
 * @evidence contracts/common.md#principled-implementation POSIX path normalization is used as an admission test: backslashes, aliases, absolute paths, drive prefixes and parent segments refuse instead of being rewritten into a trusted host identity.
 * @evidence contracts/common.md#clear-and-simple-design Both retained-host creation and reset receipt admission use this one project-relative path boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function compares canonical spelling with the supplied string and never repairs a path that could refer to a different authored host.
 * @evidence contracts/common.md#meaningful-documentation The comment lists normalized relative identity requirements and names refusal rather than suggesting the returned value repairs arbitrary paths.
 * @evidence contracts/performance.md#efficient-algorithms Normalization and component checks cost linear time in path length and allocate only normalized text and path components.
 * @evidence contracts/performance.md#reuse-equivalent-work Path admission is repeated for each supplied receipt or host address; a shared pure rule prevents the two identity maps from accepting different spellings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the admitted string escapes, while normalized and component strings are local; no pathname is opened or retained in module state.
 */
export function normalizeRelativePath(value: string): string {
  const slashed: string = value.replaceAll("\\", "/");
  const normalized: string = path.posix.normalize(slashed);
  if (
    slashed !== value ||
    slashed === "" ||
    normalized !== slashed ||
    path.posix.isAbsolute(normalized) ||
    /^[A-Za-z]:/u.test(normalized) ||
    normalized.split("/").some((part: string) : boolean => part === "." || part === "..")
  )
    throw new Error(
      `${value}: expected a normalized project-relative host path.`,
    );
  return normalized;
}
