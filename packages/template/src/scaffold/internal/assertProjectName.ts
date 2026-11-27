/*
 * Trim a project name and refuse one that cannot serve as a portable directory
 * segment and JSON string.
 *
 * The name is trimmed, then refused when empty, `.` or `..`, ending in `.`,
 * containing `<>:"/\|?*` or an ASCII control character, or matching the ASCII
 * device-name pattern `con`, `prn`, `aux`, `nul`, `com1` through `com9`, or
 * `lpt1` through `lpt9`, with or without an extension. These checks prevent
 * separators and JSON string delimiters; they do not establish npm package-name
 * validity or every filesystem's name and length restrictions.
 * Parameter name: The name as supplied.
 * Returns: The trimmed name.
 * When the name is refused.
 */
export const assertProjectName: (name: string) => string = (
  name: string,
): string => {
  const trimmed: string = name.trim();
  if (trimmed.length === 0) throw new Error("scaffold requires a project name");
  if (
    trimmed === "." ||
    trimmed === ".." ||
    trimmed.endsWith(".") ||
    /[<>:"/\\|?*\u0000-\u001f]/u.test(trimmed) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(trimmed)
  )
    throw new Error(
      `scaffold project name "${trimmed}" must be one portable directory segment`,
    );
  return trimmed;
};
