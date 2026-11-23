# src/fluid/fluidSurfaceGeometry.ts#fluidSurfaceGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Derives centred vertices from origin plus bed/depth, finite-difference normals, face-averaged flow and four-wet-nonsolid-cell quads with upward winding. Compatible arrays and representable derived arithmetic are premises; id equality alone proves neither, and normal/position outputs are not checked for finiteness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An elevation pass feeds row-major attributes, a quad pass chooses indices, and an index pass measures drawn bounds. Vertex and cell indices coincide without a remapping table, while wet bounds exclude unused dry/solid vertices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Dry quads are dropped by the solver's own `dryDepth`, not a renderer threshold, and a foreign state is refused instead of drawn; no lattice or domain is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

Gives placement/order, quad/winding rules, normal/UV/flow derivations, empty/drawn bounds, viewer metadata use, exact id refusal and unchecked numerical/layout premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(cells) time/storage: one elevation pass, one attribute pass, one quad pass and a bounds pass over at most six indices per cell. One shared elevation array avoids repeated bed/depth sums for neighboring slopes; bounds scan only drawn indices because dry/solid vertex positions must not enlarge that extent.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One derivation per state per call; nothing is cached across frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned buffers are fresh and sized by the cell count, and the elevation scratch array dies with the call.
