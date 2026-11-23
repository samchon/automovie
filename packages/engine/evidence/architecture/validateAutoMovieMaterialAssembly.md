# src/architecture/validateAutoMovieMaterialAssembly.ts#validateAutoMovieMaterialAssembly

## @evidence contracts/development/implementation.md#principled-implementation

Checks finish positions and leading/trailing wrapping runs in authored order. Requires finite computed total thickness and signed endpoints before resolution; host comparison admits a fixed absolute `1e-9` m discrepancy, without claiming a universal summation-error or authoring-precision bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator owns the build-up contract and is the gate `resolveAutoMovieMaterialAssembly` runs before placing layers; finish and wrap defects are separate private passes because each names a different author action, and blank strings use the collector's shared rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No role, substance id or layer is special-cased; a membrane may be zero thick because it is a sheet by definition, which is a contract difference, and the single-layer case follows from both faces sharing one layer rather than from an exception.

## @evidence contracts/development/common.md#meaningful-documentation

Names layer/finish/dimension defects, wrapping runs, single-layer faces, field rules, finite derived total/endpoints, host tolerance, optional substance resolution, paths and collector-based failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the layer count plus the substance count: one pass per rule group, a set for substance and layer ids, and the leading and trailing wrap runs measured once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one build-up per call; the resolver calls it once before placing, and no work is shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The substance and layer id sets are local and released on return, bounded by their counts; the returned validation holds the findings.
