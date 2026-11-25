# src/construction/IAutoMovieSolidMeshPlan.ts#IAutoMovieSolidMeshPlan.ITriangle

## @evidence contracts/development/design.md#principled-representation

Original IDs describe shared geometry while integer lifts retain the periodic face embedding used to prove positive chart orientation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two parallel triples distinguish mesh identity from cover occurrence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not reconstruct a half-period tie from global IDs or infer shared geometry from coordinate coincidence.

## @evidence contracts/development/common.md#meaningful-documentation

The first lift is zero; coordinates add lift times period before reading chart orientation.

# src/construction/IAutoMovieSolidMeshPlan.ts#IAutoMovieSolidMeshPlan.IPlan

## @evidence contracts/development/design.md#principled-representation

Triangles retain original IDs and cover lifts; split constraints retain source-edge indices so an endpoint boundary is distinguished from a trim or retained-cell boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Explicit result data carries topology and provenance without a registry or repeating the split operation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Provenance does not certify world geometry or classify every unpaired edge as an endpoint.

## @evidence contracts/development/common.md#meaningful-documentation

States index, lift and source-edge ownership and the endpoint-classification limit.
