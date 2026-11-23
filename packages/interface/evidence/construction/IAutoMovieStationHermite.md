# src/construction/IAutoMovieStationHermite.ts#IAutoMovieStationHermite

## @evidence contracts/development/design.md#principled-representation

IEnd stores equally sized value and first-derivative rows with optional second derivatives; station defaults to mm while explicit parameter-source callers supply their own coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

StationHermite interpolation and LoftCoefficientSource reuse the same endpoint array shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional curvature selects the supported cubic/quintic data boundary; row sizes and finite values remain interpolation premises.

## @evidence contracts/development/common.md#meaningful-documentation

Defines derivative order, selected coordinate and absent-curvature behavior.

# src/construction/IAutoMovieStationHermite.ts#IAutoMovieStationHermite.IEnd

## @evidence contracts/development/design.md#principled-representation

Endpoint value/first jet and optional second jet determine the cubic or quintic station interpolant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record serves section, lift and flattened plane arrays without per-field interpolators.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional curvature marks available data; equal widths and finite entries are caller premises, not guaranteed by this structure.

## @evidence contracts/development/common.md#meaningful-documentation

Names per-station derivative units and the absent-curvature meaning.
