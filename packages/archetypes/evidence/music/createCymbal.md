# src/music/createCymbal.ts#createCymbal

## @evidence contracts/development/common.md#meaningful-documentation

States the sources, estimates, local strike positions and the mounted rest.

## @evidence contracts/development/implementation.md#principled-implementation

A round plate and raised bell sit on a mast with three radial legs. The strike sites lie on the two solid surfaces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the plate and bell, then the stand, then the sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The edge uses the plate's radius and top height, and the bell uses its own top height. Contact coefficients are left unspecified.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six fixed primitives.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds an independent scenic prop.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned prop.
