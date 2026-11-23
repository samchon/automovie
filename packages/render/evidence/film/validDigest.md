# src/film/validDigest.ts#validDigest

## @evidence contracts/development/implementation.md#principled-implementation

A fully anchored regular expression decides the fixed-length grammar exactly, and lowercase-only hex keeps one spelling per digest so string comparison is digest comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate serves every digest check in the film planner; production and engine keep their own private copies of the same pattern, a cross-package duplication this file does not own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No digest value is special-cased; the pattern is the content-digest spelling the SHA-256 identity writers produce.

## @evidence contracts/development/common.md#meaningful-documentation

The doc gives the exact grammar, its callers, and why other spellings are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear regular-expression test over at most 71 matched characters, against one module-level pattern that carries no `lastIndex` state between calls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate on one short string coordinates no phases, so there is no work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The compiled pattern is one module constant for the process lifetime and each test allocates nothing, so retention stays at that single expression object.
