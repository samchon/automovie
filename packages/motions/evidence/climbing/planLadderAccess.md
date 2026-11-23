# src/climbing/planLadderAccess.ts#planLadderAccess

## @evidence contracts/development/common.md#meaningful-documentation

Names the geometry, direction, contact ownership and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the actor's limb lengths and the named fixed rung, rail and landing geometry to construct the existing support planner's actual contact targets in one direction or its reverse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare fixture frames then build one support history, delegating the pose fit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A local prop-point adapter retains true support ownership and uses only positions on the authored fixtures; the staging constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the rungs climbed: a fixed number of stances per rung, each fitted once by the support law at plan time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each staged point is computed once and looked up by its target name for both the fit and the grip seating.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the staged points and grip windows for the plan's lifetime.
