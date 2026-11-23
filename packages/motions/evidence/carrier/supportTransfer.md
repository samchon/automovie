# src/carrier/supportTransfer.ts#supportTransfer

## @evidence contracts/development/common.md#meaningful-documentation

States the boarding practice, timing, geometry and draft limits.

## @evidence contracts/development/implementation.md#principled-implementation

Checks the real entry sockets and two named planar surfaces, then uses minimum-jerk swings, overlapping plants, and rigid support carry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve surfaces, admit a docked landing for both feet, and then evaluate the fixed contact schedule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses unsupported entry, geometry and motion rather than relabeling plants or inferring a deck from scene proximity.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded dock scan and one entry forward-kinematics pass, followed by constant work per posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the foot pivot, contact-frame lookup, posture lowering and moving-support carry with other actions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan retains only its local data, prop reader and body for its lifetime.
