# src/climbing/ladderAccessRails.ts#ladderAccessRails.IRail

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

A finite segment and its lateral offset in the ladder frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields planLadderAccess reads to place a rail grip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read from the bar affordance.

# src/climbing/ladderAccessRails.ts#ladderAccessRails.IPair

## @evidence contracts/development/common.md#meaningful-documentation

States each side.

## @evidence contracts/development/design.md#principled-representation

One rail per side of the climber.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pair planLadderAccess indexes by side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both are required.

# src/climbing/ladderAccessRails.ts#ladderAccessRails.read

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, frame and the undefined case.

## @evidence contracts/development/implementation.md#principled-implementation

Transforms each bar's centre and axis by the prop's frame, then takes the first upright bar on each side of the ladder's centre line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter, one transform per bar and one pick per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the prop's own bars count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the prop's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
