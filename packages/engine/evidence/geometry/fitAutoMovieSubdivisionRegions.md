# src/geometry/fitAutoMovieSubdivisionRegions.ts#fitAutoMovieSubdivisionRegions

## @evidence contracts/development/implementation.md#principled-implementation

Uses finite support of two uniform Catmull-Clark refinements plus limit masks to crop local solves, retains graph identities through edge and face children and composes deltas on the globally refined joined cage. Original coarse targets and controls remain separate equations in fitAutoMovieSubdivisionDomain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns region extraction and exact global composition; the domain fitter owns the declared physical objective and equality solve. Semantic selection and clinical constraints remain with the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not weld by distance or paste isolated part positions into a joined mesh. Regions are disjoint, supported crease masks refine unchanged, and unsupported sharp target fans are refused; no caller names or fixture-specific fit coefficients occur.

## @evidence contracts/development/common.md#meaningful-documentation

States collar derivation, graph identity, delta composition, preserved indexed UVs and source parameters, region overlap and crease refusals, and the outstanding caller validation duties.

## @evidence contracts/development/implementation.md#efficient-algorithms

Global adjacency and two global refinements are linear in the resulting O(16F) faces. Each local solve costs its crop's sparse QPs and symbolic support terms; scanning source faces per region is needed to gather exact collar boundary anchors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Global topology, UV refinement and face adjacency are computed once and shared by all regions. Local solves share three coordinate systems internally and no completed model is cached against mutable caller input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Processes one crop at a time; temporary crop and solve arrays are released after their deltas are composed. The returned level owns one globally refined cage and result residuals, with no module retention.
