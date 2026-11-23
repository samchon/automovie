# src/geometry/curve/IAutoMoviePlanContourSlabs64Slab.ts#IAutoMoviePlanContourSlabs64Slab

## @evidence contracts/development/design.md#principled-representation

k addresses the upper cut; group side indices address rings[k-1] and rings[k], not global ring ordinals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Boundary preparation and contour emission consume the planner's same interval/group hierarchy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty or unsupported groups remain explicit; the interval record claims no manifold or geometric qualification.

## @evidence contracts/development/common.md#meaningful-documentation

Defines index base, ordering and empty-input behavior.
