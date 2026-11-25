# src/validation/validateMaterialOverlays.ts#validateMaterialOverlays

## @evidence contracts/development/implementation.md#principled-implementation

Admit optional overlay lists, record entries, required color image, blend, strength and optional numeric factors.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binding images are enumerated by materialTextureSlots, while overlay metadata admission stays here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The four-overlay policy reports excess without truncation; malformed colorFactor records and sparse entries must report instead of throwing/skipping.

## @evidence contracts/development/common.md#meaningful-documentation

Undefined overlays mean none; diagnostics locate list, entry and factor component errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

O overlays require fixed per-entry checks and proportional diagnostic storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Collector ranges own scalar policy; mutable overlays are checked per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns diagnostics and borrowed actual values, with no image load or material handle acquired.
