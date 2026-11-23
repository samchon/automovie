# src/soft/IAutoMoviePlantingArrangement.ts#IAutoMoviePlantingArrangement

## @evidence contracts/development/design.md#principled-representation

arrangePlantingCluster derives candidates from seed, slot and attempt, accepts minimum-spaced positions against already placed members and reports rejected slots with exact accepted full-TRS placements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result separates requested cluster/recipe identity from accepted positions, refusal count and nullable placement-origin bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Refused members are counted rather than squeezed into overlaps, and bounds concern accepted placement origins rather than the full grown plant geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Defines cluster/domain attribution, authored slot order, spacing refusal and empty nullable origin bounds.
