# src/film/assertGrammarPositive.ts#assertGrammarPositive

## @evidence contracts/development/implementation.md#principled-implementation

Number.isFinite and the strict positive comparison admit the declared domain of grammar durations, thresholds, lenses, aspects and subject heights. This common scalar gate does not establish the field-specific upper bound on a lens or the representability of later projection and logarithm arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule shared by `readFilmGrammar` for its two thresholds and by `normalizeGrammarShot` for durations, lenses, aspects and heights, so every positive field of the grammar input fails with the same wording.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field or caller is special-cased; the value is never clamped or replaced by a default, only accepted or refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact message, which values pass, why the read throws rather than reports, and each parameter's role.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One finiteness test and one comparison, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one number per call that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing on the accepting path and retains nothing; the thrown error is owned by the caller.
