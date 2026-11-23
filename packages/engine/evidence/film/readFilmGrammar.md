# src/film/readFilmGrammar.ts#readFilmGrammar

## @evidence contracts/development/implementation.md#principled-implementation

Findings are judged only on the observed boundary samples, adjacent shots in edit order form the cuts, and suppression is a lookup in the one-to-one `GRAMMAR_STYLE_SUPPRESSION` table applied in the same filter that records which claim excepted what, so the reported list and the unmatched claims are two views of one decision and cannot disagree; the pacing average is the arithmetic mean of the edited durations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This entry validates thresholds and shot ids, orders the checks, files shot-size and pacing findings and applies suppression; per-shot validation lives in `normalizeGrammarShot`, size measurement in `measureGrammarShotSize`, and the cut rules in `inspectGrammarCut`, so each rule has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot, subject, camera or intent is special-cased; the thresholds are the documented input defaults, and malformed input throws instead of being skipped or repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States what throws, the filing order of every finding family, how suppression applies including the film-wide pacing rule, and which orders can and cannot affect the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits every shot and normalizes its subjects, adding O(S + sum(n log(n+1))) structural work for S shots and per-shot subject counts n. Cut inspectors use the built indexes, with entrant searches linear in subject count; inspected and emitted text adds its length. Suppression uses one lookup per finding without rescanning the growing finding list.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A shot's measured size at each boundary is computed once and memoized for the call, keyed by the normalized shot object and the boundary, because the shot-size check, the jump-cut comparison and both re-establishing checks read the same pair; the inputs are immutable for the call, so no invalidation is needed, and nothing is shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains, for one call, the normalized shots, a shot index, the size memo of at most two entries per shot, the finding list and the claim keys; all are released on return except the returned findings and claims, which the caller owns.
