# src/film/normalizeRenderTier.ts#normalizeRenderTier

## @evidence contracts/development/implementation.md#principled-implementation

The check is the closed admission rule of the production design's `renderTiers` contract, evaluated field by field on finite and safe-integer predicates so NaN, infinity and fractional steps are refused rather than compared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate admits the two shapes and one structured clone returns a value the caller owns, so the planner and the frame-format projection share one rule instead of each restating it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limits are the design contract's 1-for-final and 1-through-16 step bounds; the default for an omitted tier is the documented final tier, not a guess, and an invalid tier throws instead of being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the omitted-tier default, both admitted shapes with their bounds, why a proxy must reduce something, that the result is a copy, and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call does constant work: a fixed set of comparisons and one clone of a three-field record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call validates one small record, and the planner and the projection each call it once per plan, so caching would cost more than the check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function retains nothing after returning the copy its caller owns and opens no handle or task.
