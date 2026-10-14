/**
 * Replace every `{{key}}` token in `content` with `variables[key]`.
 *
 * A key is one or more of `A-Z`, `a-z`, `0-9`, `:`, `_`, `@`, `.`, `/`, and `-`, such as `name` or `version:engine`. Everything else is an error, so a mistyped placeholder fails the render instead of shipping a broken file: a `{{` without a later `}}`, a `}}` before any `{{`, an empty, blank, or malformed key, a key that is not an own property of `variables`, and a value that itself contains `{{` or `}}`. A replaced value is never scanned again.
 *
 * @param content Template text.
 * @param variables Values by key; inherited properties are not keys.
 * @returns The rendered text.
 * @throws On any of the errors listed above, naming the token or offset.
 *
 * @evidence contracts/common.md#principled-implementation A left-to-right cursor finds delimiter pairs with indexOf and appends intervening text and selected values. The key pattern excludes braces and each value is checked for delimiters, so substituted values are never rescanned and malformed input throws before a result is returned.
 * @evidence contracts/common.md#clear-and-simple-design One function serves both file contents and path segments in `renderScaffoldEntries`, so paths and payloads follow the same token rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown key throws rather than being left in place or blanked, and the own-property check keeps `__proto__` or `constructor` from resolving through the prototype.
 * @evidence contracts/common.md#meaningful-documentation The comment states the key alphabet, every refusal with its reason, that inherited properties are not keys, and that values are not rescanned.
 * @evidence contracts/performance.md#efficient-algorithms Delimiter searches advance with the cursor and examine input spans a bounded number of times; key and value checks add their visited lengths. Output uses repeated string concatenation, whose allocation and copying cost depends on the JavaScript engine's string representation, so this owner does not guarantee linear output construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call renders one distinct text; `renderScaffoldEntries` calls it once per file content and once per path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function builds one output string and retains nothing after returning.
 */
export const renderTemplate: (
  content: string,
  variables: Readonly<Record<string, string>>,
) => string = (
  content: string,
  variables: Readonly<Record<string, string>>,
): string => {
  let cursor: number = 0;
  let rendered: string = "";
  while (cursor < content.length) {
    const opening: number = content.indexOf("{{", cursor);
    const closing: number = content.indexOf("}}", cursor);
    if (closing !== -1 && (opening === -1 || closing < opening))
      throw new Error(
        `unmatched scaffold placeholder closing delimiter at offset ${closing}`,
      );
    if (opening === -1) {
      rendered += content.slice(cursor);
      break;
    }
    rendered += content.slice(cursor, opening);
    const end: number = content.indexOf("}}", opening + 2);
    if (end === -1)
      throw new Error(
        `unmatched scaffold placeholder opening delimiter at offset ${opening}`,
      );
    const key: string = content.slice(opening + 2, end);
    if (key.length === 0) throw new Error("empty scaffold placeholder: {{}}");
    if (key.trim().length === 0)
      throw new Error(`whitespace scaffold placeholder: {{${key}}}`);
    if (/^[A-Za-z0-9:_@./-]+$/u.test(key) === false)
      throw new Error(`malformed scaffold placeholder: {{${key}}}`);
    if (Object.prototype.hasOwnProperty.call(variables, key) === false)
      throw new Error(`unknown scaffold variable: {{${key}}}`);
    const value: string = variables[key]!;
    if (value.includes("{{") || value.includes("}}"))
      throw new Error(
        `scaffold variable {{${key}}} expands to placeholder syntax`,
      );
    rendered += value;
    cursor = end + 2;
  }
  return rendered;
};
