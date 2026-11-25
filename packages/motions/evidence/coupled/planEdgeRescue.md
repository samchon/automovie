# src/coupled/planEdgeRescue.ts#planEdgeRescue

## @evidence contracts/development/common.md#meaningful-documentation

States the shared scene and the dispatch.

## @evidence contracts/development/implementation.md#principled-implementation

One scene from both bodies, then the role's planner over it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read both bodies, prepare the scene, dispatch on the role.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither role reads the other's plan; each reads the scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beyond the role's planner.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Plans once per role.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the role's plan.
