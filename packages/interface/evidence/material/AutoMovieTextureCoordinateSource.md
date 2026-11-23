# src/material/AutoMovieTextureCoordinateSource.ts#AutoMovieTextureCoordinateSource

## @evidence contracts/development/design.md#principled-representation

The three literals distinguish metric surface distance, normalized surface extent and arbitrary imported UV units; the texture-scale validator can compare only the first two against carried mesh spans.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union records the coordinate convention beside the texture reference instead of deriving it from image dimensions or transform magnitude.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Imported source UVs retain their authored unit and are not assigned a guessed physical tile size; metric and normalized bindings use their distinct scale relationships.

## @evidence contracts/development/common.md#meaningful-documentation

Explains each coordinate unit, the metric and normalized repeat formulas, and why image contents or scale alone cannot establish that unit.
