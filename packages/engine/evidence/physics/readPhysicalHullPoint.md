# src/physics/readPhysicalHullPoint.ts#readPhysicalHullPoint

## @evidence contracts/development/common.md#meaningful-documentation

Defines shape-local signed distance, the full contact and scalar reads and the packed operands of a reader scoped to one fixed volumetric hull.

## @evidence contracts/development/implementation.md#principled-implementation

Scans the actual supporting planes and the within-face and closest-edge probes. Scalar trials record the selected normal after access. The prepared entry packs those same planes and directed boundary edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One packer supplies both the one-shot entry and the scoped scalar reader. One numerical query supplies every output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty face set triggers the same error. Each read preserves its plane, facing-edge and nearest-feature comparisons.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation visits the fixed planes and edges once. Each point queries the faces and reached edges, with constant instrumentation per proof read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed hull supplies prepared geometry for each changing point. The proof checks actual reached backing and normal reads during that operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The original backing has the weak hull lifetime. The prepared entry owns its fixed arrays and synchronous working distances within the returned reader. A point answer belongs to its caller.
