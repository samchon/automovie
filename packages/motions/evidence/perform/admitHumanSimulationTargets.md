# src/perform/admitHumanSimulationTargets.ts#admitHumanSimulationTargets

## @evidence contracts/development/common.md#meaningful-documentation

States why targets are projected, what is kept and the order.

## @evidence contracts/development/implementation.md#principled-implementation

Composes the articulated chain the solver simulates: a child's rotation is the parent's times the parent anchor frame times the joint rotation times the inverse child anchor frame, and its origin lies where the two anchors meet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One parent-first walk of the profile's joint tree; the projection is the engine's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No limit is widened; a rotation inside its limits passes unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) for B segments, one projection per joint.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh frames; retains nothing.
