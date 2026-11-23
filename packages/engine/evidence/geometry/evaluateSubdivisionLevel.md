# src/geometry/evaluateSubdivisionLevel.ts#evaluateSubdivisionLevel

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same published position and normal limit masks as subdivideAutoMovieSurface; topology refinement and limit evaluation remain distinct operations so fitting-domain resolution does not silently increase render LOD.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One output materializer serves ordinary subdivision and fitted-domain consumers. It chooses the first source-face parameter per physical vertex without rebuilding UV seams from numeric values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No zero-level bypass of an unadmitted cage, approximation or vertex welding; input is an existing admitted/refined level and limit normal failures propagate unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States producer provenance required for the level, unchanged source parameters and indexed UVs, shared array ownership and the purpose of evaluating an already refined fitting domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Parameter emission is linear in corners and vertices; limit evaluation owns its one-ring refinement and exceptional-vertex eigenvector costs documented by limitSubdivisionLevel.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Completed topology and UV arrays are shared read-only with the returned surface, and each physical vertex chooses its parameter once. Limit geometry is evaluated once for both render and construction consumers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result shares level arrays rather than duplicating them, and owns new limit and parameter arrays. No module state or completed request is retained.
