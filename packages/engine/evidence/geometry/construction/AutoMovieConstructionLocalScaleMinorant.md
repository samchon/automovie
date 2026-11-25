# src/geometry/construction/AutoMovieConstructionLocalScaleMinorant.ts#AutoMovieConstructionLocalScaleMinorant.create

## @evidence contracts/development/implementation.md#principled-implementation

Uniform attenuation preserves nonuniform ratios. Positive binary64 encodings are ordered, so one predecessor guards the ratio; literal numerical and geometry checks close every result rather than assuming log/exp inverses or downward closure in floating point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates inputs, re-certifies held factors, chooses one alpha, then certifies the candidate. The geometry callback retains the existing predicate at its owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Has no fitted threshold, iteration, retry, common-factor input, clipping or silent fallback. Unchanged admissible values use alpha exactly 1.

## @evidence contracts/development/common.md#meaningful-documentation

States scalar/log units, subnormal and refusal behavior, callback effects, and discrete versus continuous scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N+C) numerical work and storage for N columns and C forward caps, plus C held and N final callback calls; no geometry queries or searches are owned here.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure invocation consumes completed field/cap work and coordinates no cross-request effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Arrays and the index map belong to one call; only the accepted field and limiting indices escape, with no retained module state.
