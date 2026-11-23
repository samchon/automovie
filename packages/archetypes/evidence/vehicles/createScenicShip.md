# src/vehicles/createScenicShip.ts#createScenicShip

## @evidence contracts/development/implementation.md#principled-implementation

Three longitudinal hull runs share deck-edge vertices with the rails. The centre rail is split at the physical boarding opening, and the bench tops position the seat frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile, build the common hull and contacts, then place the selected deck furniture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sources establish silhouettes alone. The sizes and mass are explicitly provisional, and the solid hull has no inaccessible interior contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds fixed-size section and furnishing layouts and sends only eight corners at a time to the convex-cell owner.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independently authored set.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing beyond the returned archetype.

## @evidence contracts/development/common.md#meaningful-documentation

Names the waterline, axes, physical contacts, scale controls and public ride owners.
