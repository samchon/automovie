# src/geometry/construction/AutoMovieSolidRibbon.ts#AutoMovieSolidRibbon

## @evidence contracts/development/common.md#meaningful-documentation

States the three fields and their scale.

## @evidence contracts/development/design.md#principled-representation

Represents A surface's 2-jet across a rail: what a blend copies at its edge (rule J4 of `docs/techniques/surface-composition.md` with `beta = 0`): companion namespace of 2 members (`IRibbon`, `of`); units and frames named in its text: second, local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidRibbon` in packages/engine/src/geometry/construction/AutoMovieSolidRibbon.ts; its surface is the 2 members listed and the text shows 7 other files naming it, mostly packages/engine (6), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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
