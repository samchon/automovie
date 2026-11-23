# src/environments/lifts/liftShaftParts.ts#liftShaftParts

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing rectangular wall kernel for the cut panel and bounds the side and rear solid plates by the same enclosing limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cut mesh and three simple solid parts. The caller resolves clearances and the aperture sizes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The aperture removes wall cells, and all parts come from authored shaft, car and landing dimensions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time for three boxes plus the wall kernel's cost in the opening count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one independent set of parts per shaft.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns four parts and the kernel's mesh with no external handles.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate system, the supplied front-wall cuts and how the three other panels fit.
