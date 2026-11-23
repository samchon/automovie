# src/material/IAutoMovieRgb8Image.ts#IAutoMovieRgb8Image

## @evidence contracts/development/design.md#principled-representation

Positive pixel dimensions determine a packed three-channel raster; the explicit transfer tag preserves sample interpretation without colour conversion. The ingest decoder validates the dimensions and extent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The image owns only raster facts used by PPM callers; encoded image assets and calibrated recovery views remain separate concepts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No alpha, inferred colour space or calibration is fabricated. Numeric dimension and buffer-length relationships require decoder admission.

## @evidence contracts/development/common.md#meaningful-documentation

Members state pixel units, row and channel order, transfer meaning and detached mutable ownership.
