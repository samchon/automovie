# src/scene/IBuildPlantingObjectProps.ts#IBuildPlantingObjectProps

## @evidence contracts/development/design.md#principled-representation

The input separates derived local plant structure from world member placement and optional borrowed materials, preserving full transform components for the projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One renderer input shape names source plant, arrangement, material ownership and branch resolution without duplicating numerical plant derivation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The viewer receives actual derived records rather than fixture geometry; branch taper averaging remains the builder's explicitly documented approximation.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify plant versus placement ownership, borrowed/default materials and the six-segment default; upstream owners admit their numerical inputs.
