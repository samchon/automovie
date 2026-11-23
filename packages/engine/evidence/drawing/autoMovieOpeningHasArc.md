# src/drawing/autoMovieOpeningHasArc.ts#autoMovieOpeningHasArc

## @evidence contracts/development/implementation.md#principled-implementation

A magnitude test of each bulge against the shared straight-edge threshold, which is the same rule `autoMovieOpeningArc` uses to decide whether an edge has a circle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate the drafter reads to decide whether a sheet owes the curved-linework gap, sharing its threshold constant with the arc conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No profile is special-cased; the threshold is a named constant of the bulge contract rather than a value tuned to a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the threshold, its agreement with the arc conversion and the one case, coincident ends, where they differ, and what absent bulges mean.

## @evidence contracts/development/implementation.md#efficient-algorithms

One short-circuiting pass over the bulges, linear in the edge count at worst.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate evaluated once per drawn opening; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing beyond an empty array for an absent bulge list.
