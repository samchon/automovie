# src/geometry/buildSubdivisionTopology.ts#buildSubdivisionTopology

## @evidence contracts/development/implementation.md#principled-implementation

An undirected edge map keyed by the ordered vertex pair finds each edge's opposite corner; consistent orientation makes the two uses opposite, so the fan walk over in-edges visits faces in rotational order and must cover every corner of the vertex exactly once for a single fan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one place that turns rows into edges and fans, used for the admitted cage and every refined level, with sharpness supplied by the caller because only the caller knows each edge's parent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-manifold and inconsistently wound input is refused rather than split, flipped or skipped, so the rules never run on fans they do not define.

## @evidence contracts/development/common.md#meaningful-documentation

States the edge numbering, the fan walk, every refusal and the precondition left to the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in corners: one hash lookup per corner for edges, a counting sort of corners by vertex, and one fan walk per vertex that visits each corner once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each level's rows are new, so there is no earlier result to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The edge map and per-vertex corner rows are released on return; the returned arrays are linear in corners, edges and vertices.
