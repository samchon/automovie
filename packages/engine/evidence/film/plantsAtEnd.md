# src/film/plantsAtEnd.ts#plantsAtEnd

## @evidence contracts/development/implementation.md#principled-implementation

Under admitted finite interval values, a single-pass per-foot fold keeps the greatest held start, the most recent inclusive contact; >= replaces equal-start ties with the later entry, and map insertion order fixes output order. Numeric admission remains the caller's responsibility.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One selection rule shared by both beat-boundary resolvers, so the end of one beat and the opening of the next keep the same foot on the same contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every foot and every run is judged by the same interval and recency rule; no foot or rig is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive interval, the recency and tie rules, the output order, that plants are returned by reference, both `null` cases, the clock and unit, and which resolvers store the answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the plants with a map bounded by the number of feet, linear in the plant count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure selection over one list at one instant that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The per-foot map is dropped on return; the caller owns the returned array, which references the input plants.
