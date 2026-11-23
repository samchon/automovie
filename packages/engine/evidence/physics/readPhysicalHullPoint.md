# src/physics/readPhysicalHullPoint.ts#readPhysicalHullPoint

## @evidence contracts/development/common.md#meaningful-documentation

Defines shape-local distance, full contact and actual scalar hull reads.

## @evidence contracts/development/implementation.md#principled-implementation

Sweep original flat supporting planes and within-face or closest-edge probes. Scalar trials record actual selected normal reads after access.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original full and scalar outputs share one numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No approximated distances, eager topology preparation or alternate physical candidate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear face and reached edge work, constant instrumentation per actual scalar read during a proof.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The operation can verify actual previously reached private backing and normals; no distance answer is retained here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Private backing has the existing weak hull lifetime. Reached proof and scratch do not retain distance results.
