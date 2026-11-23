# src/geometry/sweep/planAutoMovieSurfaceRigPatches.ts#planAutoMovieSurfaceRigPatches

## @evidence contracts/development/implementation.md#principled-implementation

The same structured grids, reduction strips, Coons boundaries and Hermite bridges as the surface-network declaration, welded through the shared vertex registry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns patch topology and blend writers; the orchestrator owns names, curves, fitting and posing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves patch order, exact identities and every layout refusal; no proximity welding or numerical adjustment is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, output ownership and refusal classes.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P log P + V + F) for P patches, V emitted vertices and F faces; bridges follow other blocks so their boundaries already exist.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The supplied registry deduplicates shared vertices; each patch's topology is emitted once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers layout arrays and the blend index Set to the owning rig; temporary edge samples are released on return.
