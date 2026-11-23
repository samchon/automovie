# src/vehicles/createShoppingTrolley.ts#createShoppingTrolley

## @evidence contracts/development/implementation.md#principled-implementation

The carrier's geometry and actor-facing supports use CartPushed.trolley with the shared cart draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Passes the selected geometry owner to CartConstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the measured or explicitly provisional figures recorded by the geometry owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the selected profile once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the legacy draw and the profile's parts and frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs or resources.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the carrier's orientation and working contacts.
