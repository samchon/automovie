# src/animals/solveQuadrupedSupportPlane.ts#solveQuadrupedSupportPlane

## @evidence contracts/development/common.md#meaningful-documentation

Gives model units, fixed endpoints and the sagittal solve relationship.

## @evidence contracts/development/implementation.md#principled-implementation

Roll the sagittal plane around its longitudinal axis through the attachment. Its vertical coordinate spans the ankle's lateral and vertical displacement, so the inverse rotation preserves the solved bar lengths and relative bend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projected sagittal request followed by one rigid inverse rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The returned target is the ankle. No world target is moved to fit the pose and no bone length is estimated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One existing constant-size triangle solve and one pass over its controls.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing folded sagittal triangle rather than duplicating its length, fold or reach arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh controls without retaining the target, solver or any sample.
