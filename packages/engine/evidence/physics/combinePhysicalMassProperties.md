# src/physics/combinePhysicalMassProperties.ts#combinePhysicalMassProperties

## @evidence contracts/development/common.md#meaningful-documentation

States the common frame, SI units, positive component admission, quaternion norm tolerance, ascending moments, fresh result and finite-arithmetic failure.

## @evidence contracts/development/implementation.md#principled-implementation

The mass-weighted centre uses each positive normalized weight m_i/M before multiplying its position, preserving finite means whose unnormalized numerators overflow. The shared parallel-axis tensor and dimensionless Jacobi solve then give the aggregate principal frame; finite binary64 inputs still need aggregate overflow and positivity checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit every component, sum mass in input order, accumulate the normalized weighted centre, assemble the tensor, diagonalize it and admit the principal result. Private scalar field predicates share the same input/output admission without temporary arrays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing 1e-6 quaternion-length admission remains unchanged. Inputs are never repaired; empty, nonfinite, nonpositive and overflowing aggregate properties throw instead of falling back.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of parts for admission, mass, centre and tensor assembly, followed by a fixed-size principal solve. Scalar field checks avoid three temporary admission arrays per part, and scalar weighted sums avoid two vector records per part while preserving product and input-sum association.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same scalar finite/positive predicates admit both components and computed outputs. Tensor assembly and principal axes stay with their shared physical owners; each call rereads mutable input values and retains no identity cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

All intermediate numeric state belongs to this call and is released on return or throw. The result contains a fresh centre, principal moments and rotation, with no retained part or input-array reference.
