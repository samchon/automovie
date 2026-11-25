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
