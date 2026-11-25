# src/floor/lieTogetherFrame.ts#lieTogetherFrame

## @evidence contracts/development/common.md#meaningful-documentation

States which bone it reads and the frame it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The partner's sternum region names its carrying bone, which breathes and turns with the trunk; its world position and rotation are the partner's own resolved bone at that second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the partner's carrying frame, read where the law lays a head or arm on the partner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the partner's resolved bone as it is; no offset or default frame stands in.

## @evidence contracts/development/implementation.md#efficient-algorithms

One partner bone query for one bone per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the partner reader's own bone resolution.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh frame; it retains nothing.
