import type { IAutoMovieCaptionLanguageIdentity } from "@automovie/interface";

/*
 * Parse one RFC 5646 well-formed language tag without registry semantics, or
 * return null for a malformed tag.
 *
 * Grandfathered tags are the 26 fixed productions RFC 5646 lists, matched
 * case-insensitively. Every other tag is checked against its `langtag` and
 * `privateuse` grammar, including the uniqueness requirements for variants and
 * extension singletons. Well-formed is the whole admission rule: a tag is never
 * looked up in the IANA registry, so a well-formed but unregistered subtag is
 * accepted.
 */
export const parseAutoMovieCaptionLanguage: (
  value: string,
) => IAutoMovieCaptionLanguageIdentity | null = (
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

const isVariant: (value: string) => boolean = (value: string): boolean =>
  (value.length >= 5 && value.length <= 8) ||
  (value.length === 4 && DIGIT.test(value[0]!));

const isExtensionSingleton: (value: string) => boolean = (
  value: string,
): boolean => value.length === 1 && /^[0-9A-WY-Za-wy-z]$/u.test(value);
