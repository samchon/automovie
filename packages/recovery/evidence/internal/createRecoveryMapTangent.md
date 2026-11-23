# src/internal/createRecoveryMapTangent.ts#createRecoveryMapTangent

## @evidence contracts/development/implementation.md#principled-implementation

Projecting the least-aligned Cartesian axis and taking t cross a gives two independent projected directions. They are orthonormal at exact unit t; admitted near-unit inputs instead use their actual P_t B differential in map models.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One raw two-coordinate construction serves map updates, their differentiated physical rows and optional curvature without adding a gauge constraint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Input outside the admitted near-unit gauge throws; no baseline component or camera orientation is frozen beyond the declared scale gauge.

## @evidence contracts/development/common.md#meaningful-documentation

States near-unit admission, axis selection and raw camera-frame coefficient directions, distinct from their actual map differential.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three coordinates and one cross product require constant time and memory.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A current local tangent is rebuilt after its pose changes and has no global cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only two owned tuples return and no external resource is acquired.
