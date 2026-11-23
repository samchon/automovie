# src/nature/createFireRing.ts#createFireRing

## @evidence contracts/development/implementation.md#principled-implementation

Plates of the read thickness and height, each as wide as its side of the polygon whose faces touch the read outside circle, turned round the vertical axis; the mass is the read weight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, lay the plates round the circle, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The round band is drawn as a polygon of `SEGMENTS` plates and its flange is not drawn; no contact reads either.

## @evidence contracts/development/implementation.md#efficient-algorithms `SEGMENTS` parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the ring stands, how it is drawn, its two contacts and why it carries no friction.
