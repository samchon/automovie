# src/geometry/construction/AutoMovieConicFieldJet.ts#AutoMovieConicFieldJet

## @evidence contracts/development/common.md#meaningful-documentation

States derivative ordering, independent-coordinate meaning, finite-arithmetic admission and ownership.

## @evidence contracts/development/design.md#principled-representation

Represents Scalar source partials for the shared numeric and differentiated conic algebra: companion namespace of 5 members (`IJet`, `IAlgebra`, `NUMBER`, `AD`, `fromStation`); units and frames named in its text: rational, second. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieConicFieldJet` in packages/engine/src/geometry/construction/AutoMovieConicFieldJet.ts; its surface is the 5 members listed and the text shows 16 other files naming it, mostly packages/engine (11), test (5), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieConicFieldJet.ts#AutoMovieConicFieldJet.fromStation

## @evidence contracts/development/implementation.md#principled-implementation

Copies the actual station derivatives into s and ss and sets only the explicitly constant second coordinate's partials to zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed layout conversion adapts existing source readings without retaining the source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not estimate unavailable station jets, change their coordinate or validate a singular pole.

## @evidence contracts/development/common.md#meaningful-documentation

States regular-station input, constant-p premise, derivative units and fresh-result ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three reads and one six-number tuple take constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fixed layout conversion coordinates no source preparation or query reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh tuple without retaining its three-entry input.
