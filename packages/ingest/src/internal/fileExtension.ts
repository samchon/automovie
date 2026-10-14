

/**
 * Read the case-insensitive suffix of the final project-relative path component.
 *
 * @evidence contracts/common.md#principled-implementation The last forward slash selects the contract's project-path basename and the last dot selects its extension.
 * @evidence contracts/common.md#clear-and-simple-design Suffix interpretation stays separate from container decoding and profile selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No suffix is inferred from byte content and a basename without a dot stays extensionless.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies project-relative slash convention, case folding and the empty-suffix result.
 * @evidence contracts/performance.md#efficient-algorithms Two last-index searches and one suffix lowercase copy cost O(path length) without filesystem access.
 * @evidence contracts/performance.md#reuse-equivalent-work Each inspection derives its suffix once before selecting the container parser.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary substrings are allocated; paths, file handles and container bytes are not retained.
 * @author Samchon
 */
export const fileExtension: (value: string) => string = (value: string): string => {
  const name: string = value.slice(value.lastIndexOf("/") + 1);
  const index: number = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
};
