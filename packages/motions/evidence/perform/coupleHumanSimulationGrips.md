# src/perform/coupleHumanSimulationGrips.ts#coupleHumanSimulationGrips

## @evidence contracts/development/common.md#meaningful-documentation

States who is grouped, why a one-way grip is not, and the label.

## @evidence contracts/development/implementation.md#principled-implementation

The engine admits a group only with reciprocal adjustable receivers (`preparePhysicalCoupledTargetSchedule`), so a group is a connected set of mutual grips between tracking bodies, found by union-find.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per step: the active grips, their mutual pairs joined, the sets labelled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A released performer joins no group, since the engine refuses an inactive member.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S * G^2) for S steps and G grips, G a handful per window.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh maps; retains nothing.
