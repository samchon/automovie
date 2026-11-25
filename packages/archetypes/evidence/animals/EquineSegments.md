# src/animals/EquineSegments.ts#EquineSegments.IBreed

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The dataset's own measures, by its own landmarks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the element of `BREEDS`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineSegments.ts#EquineSegments.lengths

## @evidence contracts/development/common.md#meaningful-documentation

States the scaling, the landmark each bone is scaled by and the provisional bones.

## @evidence contracts/development/implementation.md#principled-implementation

Each measure over the breed's withers height, divided by the Thoroughbred's measure over its withers height; the horse's fraction times that ratio is the equid's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio per measure, then the fractions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The unmeasured bones are named as the horse's, not invented.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Seven ratios.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function, called once per equid.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
