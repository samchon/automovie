# src/compose/HumanTouchArmReference.ts#HumanTouchArmReference.reference

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, the margin, who reads it and what a lent fit replaces.

## @evidence contracts/development/implementation.md#principled-implementation

Solved by the posture resolver itself, so the reference is an arm the fit can return; its forearm twist is then kept `MARGIN` inside the forearm's range, since a reference at a range's end asks the fit to hold the joint at its limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture solve, one read and one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A forearm whose range is narrower than twice the margin keeps the solved twist.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the posture resolver and reference reading; a synchronous parent may lend same-body FK/genuine ROM metadata to this actual complete fit, without retaining or substituting its solution.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per call, or the caller's one arm fit on the pose it already holds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/HumanTouchArmReference.ts#HumanTouchArmReference.boundedReference

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the source, units and ownership of the returned joint angles and the missing-range case.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects the solved twist with the forearm's actual range inset by the laid arm's existing MARGIN at each end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constraint query and one interval clamp determine the one angular component that can change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same physical margin applies at both ends. At width twice MARGIN or less the original solved reference is returned, preserving the existing equality boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lower-arm constraint query and constant scalar work suffice. The caller can supply the selected fit's angles without another IK solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordinary reference fit and an already fitted independent arm both apply this one bound to their actual angles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No pose, candidate history or reader is retained by the function.
