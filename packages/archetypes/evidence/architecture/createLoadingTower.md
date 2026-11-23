# src/architecture/createLoadingTower.ts#createLoadingTower

## @evidence contracts/development/implementation.md#principled-implementation

Box surfaces and the doorway's two jambs and lintel share dimensions with the staging contacts. Round wheel faces and shallow hubs use the builder's cylinder primitive.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the scenic dimensions, place the floors and shell, then record the doorway and wheel faces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The prop is fixed scenery; each named contact describes its visible face or opening. Bands are fictional scene estimates, with the museum source used for appearance only.

## @evidence contracts/development/implementation.md#efficient-algorithms

The number of parts is fixed for all draws.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds independent scenery.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no resources outside the returned model.

## @evidence contracts/development/common.md#meaningful-documentation

States the scene origin, axes, geometry and staging contacts.
