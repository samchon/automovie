# src/validation/validatePose.ts#validatePose

## @evidence contracts/development/implementation.md#principled-implementation

Admit skeleton identity, optional root transform, duplicate/undeclared joint bones and effective rig/default ROM.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One by-bone map shares membership lookup; getConstraint/validateJointRom own angular policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null joint angles mean rest and absent effective constraints skip ROM; typed record/list shape is a premise.

## @evidence contracts/development/common.md#meaningful-documentation

Optional path/collector composition, reported faults and non-clamping behavior are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

B rig bones and J joints require expected O(B+J) indexing/checks plus fixed axis work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The by-bone map is request-local and default constraint/ROM owners are shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns diagnostics; temporary map/set storage releases without an FK pose or host resource.
