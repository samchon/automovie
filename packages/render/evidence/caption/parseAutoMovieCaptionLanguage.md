# src/caption/index.ts#parseAutoMovieCaptionLanguage

## @evidence contracts/development/implementation.md#principled-implementation

The parser is a left-to-right recognizer of RFC 5646 section 2.1: after rejecting any character outside letters, digits and hyphens and any subtag outside one to eight characters, it consumes language, up to three extlangs, script, region, unique variants, unique extensions with at least one subtag each, and a private-use tail in grammar order, and accepts only when every subtag is consumed; greedy consumption is exact because the productions at each position differ by length or character class.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the grammar for all caption consumers, returning both the authored spelling and the comparison key, so design validation, film assembly, readability and WebVTT serialization cannot disagree about a tag.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grandfathered set is the RFC's own fixed list, a contract-defined table, and no registry, Preferred-Value replacement or language inference is applied.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the grandfathered rule, the grammar and uniqueness checks applied, the null result for a malformed tag, and that registry membership is not checked.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over at most the tag's subtags with constant-time regular-expression tests per subtag makes the cost linear in the tag length; the two sets hold at most the variants and singletons present.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure parse of one short string coordinates no phases, and its callers parse each tag at most a few times per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The subtag array and the two uniqueness sets are released on return; only the module-level grandfathered set and patterns persist, fixed in size.
