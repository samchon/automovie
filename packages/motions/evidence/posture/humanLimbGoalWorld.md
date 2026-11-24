# src/posture/humanLimbGoalWorld.ts#humanLimbGoalWorld

## @evidence contracts/development/common.md#meaningful-documentation

States the transform, the refusal and its reason.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid transform of the goal by the bone's posed frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame read and one transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal on its own chain or on a missing bone throws instead of chasing itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

An attached goal requests only its carrying bone and ancestor FK while preserving ordered authored-joint admission; a supplied exact reading shares that completed frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses poseBones, or the same exact authored-FK reader the fit's clearance and engine source read consume; a self-chain refusal precedes that read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
