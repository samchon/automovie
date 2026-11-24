# src/props/createScenicParadeBanner.ts#createScenicParadeBanner

## @evidence contracts/development/common.md#meaningful-documentation

States the shared prop, local axes, units, seed and motion sites.

## @evidence contracts/development/implementation.md#principled-implementation

Each pole shares an axis with the corresponding panel edge and grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draws dimensions, builds the panel and mirrored supports, then adds the front marker.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Independent bands keep the poles above the panel's lower edge without clamping any author dimension.

## @evidence contracts/development/implementation.md#efficient-algorithms

Emits three primitives and three contacts from six dimension draws.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no evaluation state.
