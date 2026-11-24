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

# src/physics/readPhysicalHullPoint.ts#readPhysicalHullPoint.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines a scalar reader owned by one fixed volumetric hull and describes the packed operands it prepares.

## @evidence contracts/development/implementation.md#principled-implementation

Packs the exact existing supporting planes and directed boundary edges, then applies the established signed-distance query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One packer supplies the original one-shot entry and the scoped reader. One query evaluates both.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty face set raises the same error. No query omits its plane, facing-edge or nearest-feature comparisons.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear pass builds the fixed planes and edges. Each point runs the usual linear face scan and only its reached facing edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied supporting hull is consumed directly. The reader prepares shared geometric operands for the scope, then reads new coordinates on every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No registry is written by this entry. All owned fixed arrays and synchronous working storage release with the reader.
