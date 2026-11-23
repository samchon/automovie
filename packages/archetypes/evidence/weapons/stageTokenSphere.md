# src/weapons/stageTokenSphere.ts#stageTokenSphere

## @evidence contracts/development/common.md#meaningful-documentation

Names the sphere origin, its shared surface and actor contact.

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the same sphere and support placement across round digital silhouettes without redoing the model draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Records one sphere and one grip at the same centre.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the measured or explicitly provisional figures recorded by the geometry owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the selected profile once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the legacy draw and the profile's parts and frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs or resources.
