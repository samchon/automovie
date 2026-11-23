# src/geometry/curve/planAutoMovieContourSlabs64.ts#planAutoMovieContourSlabs64

## @evidence contracts/development/implementation.md#principled-implementation

Explicit incidence replaces nearest correspondence when supplied. Legacy union-find and geometric separation apply to representable boundaries; unresolved curve representations cannot steal ordinary matches, and untraceable event incidence remains a local unsupported group.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One planner owns correspondence, keeping shared-boundary subdivision and mesh emission with the tessellator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source face, source vertex, tolerance weld or count-based invented critical event is admitted. Unsupported explicit groups remain local gaps.

## @evidence contracts/development/common.md#meaningful-documentation

States complete adjacency coverage, exact event addressing, ordinary and simple-event support, local unrepresentable boundaries, and unclaimed embedding and sector topology.

## @evidence contracts/development/implementation.md#efficient-algorithms

Explicit mode records loop incidences and their owning groups plus event incidence per group. Legacy mode retains pairwise sampled separation and sorted greedy correspondence; no geometric nearest query runs in explicit mode.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The completed plan is reused for common slit preparation and subsequent emission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-call partition maps, union-find arrays and plan records retain no input mesh or external resource; plans transfer to one tessellation.
