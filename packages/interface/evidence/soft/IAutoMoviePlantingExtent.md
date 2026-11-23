# src/soft/IAutoMoviePlantingExtent.ts#IAutoMoviePlantingExtent

## @evidence contracts/development/design.md#principled-representation

Candidate sampling offsets the anchor independently within plus/minus each finite half-extent, with zero allowing a line or point placement domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two planar dimensions define placement support independently from grown plant height and per-member scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extents are center-origin half-sizes, not full widths or inferred occupied foliage bounds; minimum spacing may still reject a degenerate domain.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world axes, meter units and non-negative half-extent meaning.
