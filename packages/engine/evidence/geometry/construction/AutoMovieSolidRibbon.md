# src/geometry/construction/AutoMovieSolidRibbon.ts#AutoMovieSolidRibbon.of

## @evidence contracts/development/implementation.md#principled-implementation

Applies the directional first/second chain rule to S(r+w*a*d) with chart direction and scale held fixed at this rail reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One surface jet and two weighted vector sums produce exactly the three boundary fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses analytic surface partials without finite differences or a fabricated normal; regular jets and a transverse direction for a regular blend remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives chart parameters/direction, cross scale and the complete derivative formulas above.

## @evidence contracts/development/implementation.md#efficient-algorithms

One surface-jet callback and fixed-size vector arithmetic take constant additional work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same newly fetched jet supplies point, first and second fields; this function does not reuse a previously fetched caller jet or coordinate requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the jet's point reference and two fresh derivative triples; temporary weighted-term arrays are call-local and no cache is owned.

# src/geometry/construction/AutoMovieSolidRibbon.ts#AutoMovieSolidRibbon.fromJet

## @evidence contracts/development/common.md#meaningful-documentation

Puts the source 2-jet at the rail in the result's source frame. The first and second derivatives use the chart direction and cross scale defined on the shared ribbon owner.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the rail point and the directional first and second derivatives along the fixed chart direction scaled per unit cross parameter. The mixed second partial enters with coefficient twice the product of the scaled direction components.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the two weighted vector sums used by both callers with a prepared source jet and the surface-reading `of` entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the given analytic partials in the source frame. The caller supplies a regular jet and a direction transverse to its rail for a regular blend.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses fixed-size vector operations and makes no surface evaluations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the actual jet already read by the caller for the point and both derivatives. The same derivative arithmetic serves a fresh jet from `of`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The point borrows the jet's point reference. Both derivative vectors are fresh and all weighted terms expire with the call.
