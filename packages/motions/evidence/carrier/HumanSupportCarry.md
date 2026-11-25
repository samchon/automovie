# src/carrier/HumanSupportCarry.ts#HumanSupportCarry.blend

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the shared entry frame, destination weight and exact endpoints.

## @evidence contracts/development/implementation.md#principled-implementation

Represents each rigid carry by a carried anchor and rotation. The engine interpolates the anchor linearly and the rotation on its shorter arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes one blended carry for every world-space posture channel. The caller owns the load-transfer schedule and each plant's carrier.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves unit rotation at intermediate weights and returns the exact input carry at either endpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Blends two anchors and two rotations in constant space and time with one rotation per point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares engine interpolation and the support heading calculation used for a single carry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

An intermediate carry keeps only the entry anchor, blended anchor and turn for as long as its caller holds it.
