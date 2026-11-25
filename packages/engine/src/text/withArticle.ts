/**
 * Prefix a diagnostic subject with an article selected from its first written
 * letter: a/e/i/o/u choose an, everything else chooses a. Empty strings choose
 * a. Case is ignored for the first letter; the original subject is retained.
 *
 * This spelling heuristic serves diagnostic labels and does not infer
 * pronunciation. Values such as unit, hour, acronyms and numeral-led strings
 * can need a different spoken article; arbitrary strings from malformed input
 * are not guaranteed grammatical.
 */
export const withArticle: (value: string) => string = (value: string): string =>
  `${VOWEL_LETTERS.has((value[0] ?? "").toLowerCase()) ? "an" : "a"} ${value}`;

/** The letters that take `an` in front of a name of this project's coining. */
const VOWEL_LETTERS: ReadonlySet<string> = new Set(["a", "e", "i", "o", "u"]);
