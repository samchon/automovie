/**
 * Parsed RFC 5646 caption-language identity.
 *
 * `display` retains the authored spelling. `comparisonKey` folds only ASCII
 * case, as RFC 5646 comparison requires, without consulting a language
 * registry or replacing a tag with a Preferred-Value.
 */
interface IAutoMovieCaptionLanguageIdentity {
  /** Authored language tag preserved for display and serialization. */
  display: string;
  /** ASCII case-insensitive identity used by every caption consumer. */
  comparisonKey: string;
}

const GRANDFATHERED_LANGUAGE_TAGS: ReadonlySet<string> = new Set([
  "art-lojban",
  "cel-gaulish",
  "en-gb-oed",
  "i-ami",
  "i-bnn",
  "i-default",
  "i-enochian",
  "i-hak",
  "i-klingon",
  "i-lux",
  "i-mingo",
  "i-navajo",
  "i-pwn",
  "i-tao",
  "i-tay",
  "i-tsu",
  "no-bok",
  "no-nyn",
  "sgn-be-fr",
  "sgn-be-nl",
  "sgn-ch-de",
  "zh-guoyu",
  "zh-hakka",
  "zh-min",
  "zh-min-nan",
  "zh-xiang",
]);

const ALPHA: RegExp = /^[A-Za-z]+$/u;

const ALPHANUMERIC: RegExp = /^[A-Za-z0-9]+$/u;

const DIGIT: RegExp = /^[0-9]+$/u;

/**
 * Parse one RFC 5646 well-formed language tag without registry semantics, or
 * return null for a malformed tag.
 *
 * Grandfathered tags are the 26 fixed productions RFC 5646 lists, matched
 * case-insensitively. Every other tag is checked against its `langtag` and
 * `privateuse` grammar, including the uniqueness requirements for variants and
 * extension singletons. Well-formed is the whole admission rule: a tag is never
 * looked up in the IANA registry, so a well-formed but unregistered subtag is
 * accepted.
 *
 * @evidence contracts/common.md#principled-implementation The parser is a left-to-right recognizer of RFC 5646 section 2.1: after rejecting any character outside letters, digits and hyphens and any subtag outside one to eight characters, it consumes language, up to three extlangs, script, region, unique variants, unique extensions with at least one subtag each, and a private-use tail in grammar order, and accepts only when every subtag is consumed; greedy consumption is exact because the productions at each position differ by length or character class.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the grammar for all caption consumers, returning both the authored spelling and the comparison key, so design validation, film assembly, readability and WebVTT serialization cannot disagree about a tag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The grandfathered set is the RFC's own fixed list, a contract-defined table, and no registry, Preferred-Value replacement or language inference is applied.
 * @evidence contracts/common.md#meaningful-documentation The doc states the grandfathered rule, the grammar and uniqueness checks applied, the null result for a malformed tag, and that registry membership is not checked.
 * @evidence contracts/performance.md#efficient-algorithms One pass over at most the tag's subtags with constant-time regular-expression tests per subtag makes the cost linear in the tag length; the two sets hold at most the variants and singletons present.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure parse of one short string coordinates no phases, and its callers parse each tag at most a few times per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The subtag array and the two uniqueness sets are released on return; only the module-level grandfathered set and patterns persist, fixed in size.
 */
export const parseAutoMovieCaptionLanguage: (value: string) => IAutoMovieCaptionLanguageIdentity | null = (
  value: string,
): IAutoMovieCaptionLanguageIdentity | null => {
  if (/^[A-Za-z0-9-]+$/u.test(value) === false) return null;
  const comparisonKey: string = value.toLowerCase();
  if (GRANDFATHERED_LANGUAGE_TAGS.has(comparisonKey))
    return { display: value, comparisonKey };

  const subtags: string[] = value.split("-");
  if (
    subtags.some(
      (subtag: string): boolean =>
        subtag.length === 0 ||
        subtag.length > 8 ||
        ALPHANUMERIC.test(subtag) === false,
    )
  )
    return null;

  if (subtags[0]!.toLowerCase() === "x")
    return subtags.length > 1 ? { display: value, comparisonKey } : null;

  let index: number = 0;
  const language: string = subtags[index++]!;
  if (ALPHA.test(language) === false || language.length < 2) return null;
  if (language.length <= 3) {
    for (
      let extlangCount: number = 0;
      extlangCount < 3 &&
      index < subtags.length &&
      subtags[index]!.length === 3 &&
      ALPHA.test(subtags[index]!);
      extlangCount += 1
    )
      index += 1;
  }

  if (
    index < subtags.length &&
    subtags[index]!.length === 4 &&
    ALPHA.test(subtags[index]!)
  )
    index += 1;
  if (
    index < subtags.length &&
    ((subtags[index]!.length === 2 && ALPHA.test(subtags[index]!)) ||
      (subtags[index]!.length === 3 && DIGIT.test(subtags[index]!)))
  )
    index += 1;

  const variants: Set<string> = new Set();
  while (index < subtags.length && isVariant(subtags[index]!)) {
    const variant: string = subtags[index]!.toLowerCase();
    if (variants.has(variant)) return null;
    variants.add(variant);
    index += 1;
  }

  const singletons: Set<string> = new Set();
  while (index < subtags.length && isExtensionSingleton(subtags[index]!)) {
    const singleton: string = subtags[index]!.toLowerCase();
    if (singletons.has(singleton)) return null;
    singletons.add(singleton);
    index += 1;
    const firstExtensionSubtag: number = index;
    while (
      index < subtags.length &&
      subtags[index]!.length >= 2 &&
      subtags[index]!.length <= 8
    )
      index += 1;
    if (index === firstExtensionSubtag) return null;
  }

  if (index < subtags.length && subtags[index]!.toLowerCase() === "x") {
    index += 1;
    if (index === subtags.length) return null;
    index = subtags.length;
  }

  return index === subtags.length ? { display: value, comparisonKey } : null;
};

const isVariant: (value: string) => boolean = (value: string): boolean =>
  (value.length >= 5 && value.length <= 8) ||
  (value.length === 4 && DIGIT.test(value[0]!));

const isExtensionSingleton: (value: string) => boolean = (value: string): boolean =>
  value.length === 1 && /^[0-9A-WY-Za-wy-z]$/u.test(value);
