# src/handling/HumanGraspReach.ts#HumanGraspReach.around

## @evidence contracts/development/common.md#meaningful-documentation

The complete and hand-only overloads keep the world target point, wrapped axis and metre width while turning the inward approach by degrees.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation of the approach about the wrapped axis by the turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target spread and one approach transform serve both existing target views.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every other target field is kept and no collider list, width or contact point is manufactured.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant rigid-transform work with no variable population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Complete closure and narrow hand goals use this same numerical owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh target wrapper and approach vector without retained state.
