


/** Derive the same Unicode-aware implicit anchor used by evidence targets.
 *
 * @evidence contracts/common.md#principled-implementation Unicode letters, numbers and underscore are retained after lowercase conversion; whitespace and hyphen runs collapse to one interior hyphen.
 * @evidence contracts/common.md#clear-and-simple-design One slug function mirrors native evidence's implicit target-address grammar.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Punctuation is omitted by the declared native grammar, not by prose-quality or semantic normalization.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies Unicode-aware implicit anchor compatibility.
 * @evidence contracts/performance.md#efficient-algorithms For L title characters, one traversal and final trailing-hyphen removal are linear in input length, with an output string.
 * @evidence contracts/performance.md#reuse-equivalent-work All implicit reader targets use this single address grammar; titles are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the slug string escapes and no source population or resource is retained.
 */
export const markdownSlug: (title: string) => string = (title: string): string => {
  let output: string = "";
  let hyphen: boolean = false;
  for (const character of title.toLowerCase())
    if (
      /^\p{L}$/u.test(character) ||
      /^\p{N}$/u.test(character) ||
      character === "_"
    ) {
      output += character;
      hyphen = false;
    } else if (
      (character === "-" || /^\s$/u.test(character)) &&
      output !== ""
    ) {
      if (hyphen === false) output += "-";
      hyphen = true;
    }
  return output.replace(/-$/u, "");
};
