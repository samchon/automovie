# src/geometry/construction/AutoMovieConstructionPortMeridian.ts#AutoMovieConstructionPortMeridian

## @evidence contracts/development/common.md#meaningful-documentation

Describes the world guide, the section coordinate it keeps, the cross polynomial and the facing half turn.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the declared section on the original cross meridian. The scalar coefficient follows by evaluating the basis at the interior guide. Each end has a zero of multiplicity three, and the positive cosine cubed has a zero with two zero derivatives at the half-turn boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Checks the source range and bracket, prepares the coefficient once, then returns a reader for the corrected world 2-jet. Each term names its chart derivative.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses analytic derivatives and reports an unavailable guide before publishing the port. The source provides both boundary jets, and the section coordinate stays exact.

## @evidence contracts/development/implementation.md#efficient-algorithms

The guide uses a bounded scalar bracket. A subsequent jet evaluation reads one original jet and evaluates a fixed set of scalar products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bracket returns its already evaluated world point. Each corrected 2-jet shares the source point derivatives, the cross factors and the angular factors within its call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the original surface, finite chart range and the prepared guide values. Each query owns its independent vector results. No sampled skins or previous query results survive.
