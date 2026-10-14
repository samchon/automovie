/**
 * Prefix a diagnostic subject with an article selected from its first written letter: a/e/i/o/u choose an, everything else chooses a. Empty strings choose a. Case is ignored for the first letter; the original subject is retained.
 *
 * This spelling heuristic serves diagnostic labels and does not infer pronunciation. Values such as unit, hour, acronyms and numeral-led strings can need a different spoken article; arbitrary strings from malformed input are not guaranteed grammatical.
 *
 * @evidence contracts/common.md#principled-implementation Checks the lowercase first code unit against a fixed vowel-letter set, a spelling heuristic rather than a general English phonetic rule; missing first code unit uses the consonant branch.
 * @evidence contracts/common.md#clear-and-simple-design One diagnostic formatting helper shared by light, action and analysis messages; it performs no source-text grading, admission or rewriting of the supplied subject.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject follows the same first-letter membership rule; no fixture, action or light kind gets its own article exception, and pronunciation limitations remain explicit.
 * @evidence contracts/common.md#meaningful-documentation States first-letter selection, case handling, empty-string behavior, original-text preservation and pronunciation/numeral limitations.
 * @evidence contracts/performance.md#efficient-algorithms First-letter classification takes constant work; producing the prefixed string uses output-length storage under the host's string representation, with no scan of prior messages.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shares one fixed vowel-letter set and computes each current subject independently; it coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The module retains five fixed letters and the caller owns each result string; no subject, message history or resource handle is retained.
 */
export const withArticle: (value: string) => string = (value: string): string =>
  `${VOWEL_LETTERS.has((value[0] ?? "").toLowerCase()) ? "an" : "a"} ${value}`;

/**
 * The letters that take `an` in front of a name of this project's coining.
 */
const VOWEL_LETTERS: ReadonlySet<string> = new Set(["a", "e", "i", "o", "u"]);
