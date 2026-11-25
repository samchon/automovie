# src/posture/mixHumanPosture.ts#mixHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States what the two postures are, how each field moves and what a limb or digit goal keeps.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation of the additive difference: clinical angles and world offsets are the quantities a layer adds, so scaling the difference scales the layer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four scalars, one pass over the joints either sets, one over the four limbs and one over the digits either sets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal's planting, contact and attachment are never mixed, and no goal either posture holds is dropped between the ends; the ends return the given postures unchanged, so a full or absent layer costs and changes nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints and digit goals the two postures hold.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
