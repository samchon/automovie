# src/validation/validateAffordanceArticulation.ts#validateAffordanceArticulation

## @evidence contracts/development/implementation.md#principled-implementation

Reference resolution over two id sets, then independent walks of rides and follows: travel resolution reads only follows, and subsequent spatial evaluation recurses only through rides, so mixing the edges would refuse valid mechanisms. A follower's range check evaluates the extrema of its piecewise-linear map; reversible admission uses the same inverse that normalizes authored inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One leaf owns the cross-record articulation rules, beside `validateAffordance`, which owns one record's own fields; the follower's rule is evaluated by `affordanceFollowedTravel` and the ranges read from `affordanceTravelRange`, the same owners the archetypes' pose reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Faults are reported, never repaired; a `rides` cycle is reported once per affordance on it or leading into it, at its own `rides`, saying which of the two it is, and a cycle through `follows` at the `follows` that leads into it. A ratio on an endless crank gives an endless travel, admitted only when the follower is endless too.

## @evidence contracts/development/common.md#meaningful-documentation

States each admitted rule and where a fault is reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

A affordances, P claimed parts and T table rows cost O(A + P + T) for resolution and ranges and O(A squared) at worst for the chain walks with one visited set each, on lists of tens.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pass over one model's affordances per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the diagnostic rows; the id maps are released on return.
