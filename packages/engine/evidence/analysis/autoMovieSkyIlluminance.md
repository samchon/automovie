# src/analysis/autoMovieSkyIlluminance.ts#autoMovieSkyIlluminance

## @evidence contracts/development/implementation.md#principled-implementation

The isotropic sky's illuminance on a plane is `DHI × V`; a cosine-weighted direction set makes the visible fraction an unbiased estimate of `V`, exact for an unobstructed upward plane. Directions below the ground stay in the denominator, so a tilted plane loses its unseen sky.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracted from the daylight study so the study and the illuminance meter share one sky term instead of copying it; it returns a measuring function because the direction set depends only on the plane and the ground.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No case is special-cased; refusals are the hemisphere sampler's.

## @evidence contracts/development/common.md#meaningful-documentation

States the model, the shared direction set, where the estimate is exact and the thrown refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparing costs O(D) for D directions; each point costs O(D × P) for P solid planes, stopping each ray at its first blocker.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The skyward direction subset is computed once and reused for every point, valid because it depends only on the normal, the count and the ground, which the prepared function captures.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the open direction list and the caller's solids until the caller drops it; nothing else is held.
