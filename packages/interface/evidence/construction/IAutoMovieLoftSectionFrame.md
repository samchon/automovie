# src/construction/IAutoMovieLoftSectionFrame.ts#IAutoMovieLoftSectionFrame

## @evidence contracts/development/design.md#principled-representation

Three triples encode origin, planar x axis and planar z axis in world coordinates; geometric orthonormality is a caller premise, not a structural type guarantee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The explicit basis record serves placement and interpolation without a hidden matrix convention.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This interface neither validates nor normalizes its axes; derivative-valued frame fields intentionally use the same shape without unit axes.

## @evidence contracts/development/common.md#meaningful-documentation

Gives origin units, geometric axis roles and the distinction between a rotation frame and its component derivatives.
