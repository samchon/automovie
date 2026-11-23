# src/motion/AirborneTakeoffJacobian.ts#AirborneTakeoffJacobian

## @evidence contracts/development/common.md#meaningful-documentation

States the angle factorization, differential, frames, column order and radians per momentum-unit result.

## @evidence contracts/development/implementation.md#principled-implementation

Analytically inverts the Euler-angle rate map of Rx(phi) Rz(theta) Ry(psi), after carrying tangents through the inverse frame; a near-singular tilt retains its original division and is not regularized.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Share the unchanged frame and angle factors, then write each tangent's derivatives directly into the solver's three rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the existing arithmetic and singular behavior without a tolerance, finite difference, clamp or fitted derivative.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(k) work with three output rows, no intermediate column arrays or transpose; one inverse and four trigonometric evaluations serve all k present tangents. The current shooting solver supplies three.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All columns use the same axes and endpoint angles, so their inverse and sine/cosine factors are computed once. Lazy initialization preserves empty and sparse inputs; neither the flight nor its derivative is reintegrated here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned numeric rows escape; input angles, axes and tangent arrays are read without mutation and no cache is held.
