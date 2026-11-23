# src/construction/IAutoMovieSolidMeshConstraints.ts#IAutoMovieSolidMeshConstraints.ISegment

## @evidence contracts/development/design.md#principled-representation

Endpoint IDs name original evaluated vertices; turn selects the second endpoint's sheet without changing its identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two IDs and one integer expose the complete indexed segment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contains no inferred world point, normal or positional weld.

## @evidence contracts/development/common.md#meaningful-documentation

Members state endpoint authority and the cover-turn convention.

# src/construction/IAutoMovieSolidMeshConstraints.ts#IAutoMovieSolidMeshConstraints.IEdge

## @evidence contracts/development/design.md#principled-representation

The indexed subsegment and its source list preserve the input-to-refinement relation across overlaps and T junctions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the same segment record with one explicit provenance array.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Duplicate geometry does not discard an inducing segment or replace a vertex identity.

## @evidence contracts/development/common.md#meaningful-documentation

Sources index the original segment population, independently of output ordering.
