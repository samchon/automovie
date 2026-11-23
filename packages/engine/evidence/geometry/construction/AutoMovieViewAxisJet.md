# src/geometry/construction/AutoMovieViewAxisJet.ts#AutoMovieViewAxisJet.fixed

## @evidence contracts/development/implementation.md#principled-implementation

Fixed directions have zero derivatives; the supplied origin derivatives belong to the same source value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor shares the constant-basis rule among straight, level and parallel axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not estimate origin derivatives or fabricate them at a singular source station.

## @evidence contracts/development/common.md#meaningful-documentation

Arguments are the source frame and its origin's two derivatives in the query coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies two triples and allocates four zero triples in constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure constructor has no shared preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result borrows the supplied value frame and owns all derivative triples; it retains no other source data.

# src/geometry/construction/AutoMovieViewAxisJet.ts#AutoMovieViewAxisJet.parameter

## @evidence contracts/development/implementation.md#principled-implementation

Applies Fq=Fs*sq and Fqq=Fss*sq^2+Fs*sqq to the actual source frame; no inversion of a singular forward jet is needed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared vector conversion serves straight, level and jointed analytic owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Default station queries return the original jet unchanged; invalid or unrepresentable parameter results return null without clamping.

## @evidence contracts/development/common.md#meaningful-documentation

The selected parameter endpoints use kernel mm; value remains the same source plane and derivative units become per selected coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One inverse scalar jet and fixed 27-component arithmetic take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All frame components share the same inverse-parameter pair.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the input for identity or new derivative vectors for a selected map; no global state retains either.
