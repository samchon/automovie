# src/construction/IAutoMovieSeamStation.ts#IAutoMovieSeamStation

## @evidence contracts/development/design.md#principled-representation

ICopy carries coefficient and nine-component plane rows with first/second physical-station derivatives; orientation changes sign only on first derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SeamStation copies a shared endpoint into the neighboring loft chart using the existing coefficient and frame layouts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Array lengths and matching source geometry are caller premises; a copied row is not an independent continuity certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Defines plane layout and derivative sign transfer across a seam.

# src/construction/IAutoMovieSeamStation.ts#IAutoMovieSeamStation.ICopy

## @evidence contracts/development/design.md#principled-representation

The record carries the owner's boundary data and both derivative orders after conversion to a neighbour's station direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six arrays separate section coefficients from flattened plane values and their derivatives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type certifies neither matching widths nor geometric equality; copy's producer premises and the continuation operator own those checks.

## @evidence contracts/development/common.md#meaningful-documentation

Names the nine-component plane layout, first-derivative sign and squared second-derivative factor.
