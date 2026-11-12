/**
 * Trim a project name and refuse one that cannot serve as a portable directory segment and JSON string.
 *
 * The name is trimmed, then refused when empty, `.` or `..`, ending in `.`, containing `<>:"/\|?*` or an ASCII control character, or matching the ASCII device-name pattern `con`, `prn`, `aux`, `nul`, `com1` through `com9`, or `lpt1` through `lpt9`, with or without an extension. These checks prevent separators and JSON string delimiters; they do not establish npm package-name validity or every filesystem's name and length restrictions.
 *
 * @param name The name as supplied.
 * @returns The trimmed name.
 * @throws When the name is refused.
 *
 * @evidence contracts/development/implementation.md#principled-implementation After trim, explicit separator, ASCII control and device-name checks refuse the listed unsafe names; excluding quote, backslash and ASCII controls keeps plain substitution inside package.json's JSON string valid. This is a partial filename policy rather than npm-name or universal filesystem validation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure `createAutoMovieScaffold` admits its `{{name}}` through this one rule, so a production, a workspace and a workspace production refuse the same names.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused name throws; nothing is rewritten into an admitted spelling.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the trim, every refusal and why it matters, and what the rule does not establish.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two regular-expression scans and fixed comparisons cost linear time in the name's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call checks one supplied name once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a string and retains nothing.
 */
export const assertScaffoldProjectName: (name: string) => string = (
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
