# src/scene/IChunkObject.ts#IChunkObject

## @evidence contracts/development/design.md#principled-representation

Binds one compiled formation chunk's bounds/anonymous placements to tier instance buffers and prior tier selection; metre-space radius supports culling, while selected null means no previous admitted tier and removed counts cue-taken members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps per-chunk culling/hysteresis and resident buffer references together, separate from tier-wide shared geometry/material/cycle ownership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Anonymous membership comes from compiled slots and cue removal, not promoted-hero fixture assumptions or full-population per-member objects.

## @evidence contracts/development/common.md#meaningful-documentation

Gives runtime bounds/membership, metre radius, tier-map ownership role, nullable prior selection and current cue-removal meaning.
