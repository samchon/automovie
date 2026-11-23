# src/scene/autoMovieAnalysisRampColor.ts#autoMovieAnalysisRampColor

## @evidence contracts/development/implementation.md#principled-implementation

Uses two linear segments through blue (0,0,1), green (0,1,0) and red (1,0,0), clamping normalized positions to [0,1]; finite normalized inputs are the overlay premise, with no claim about later renderer color management or NaN repair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar-to-RGB value function owns the overlay ramp definition without texture sampling, palette state or renderer dependence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Endpoints and the green midpoint define the supported ramp, not expected-fixture exceptions; no foreign method replacement, hidden gamma adjustment or special metric key occurs.

## @evidence contracts/development/common.md#meaningful-documentation

States the three stops, piecewise channel interpolation, out-of-range clamping, caller color-space responsibility and NaN limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one clamp, branch and fixed-count arithmetic operations and allocates one three-channel value, constant time/space per point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses a single ramp definition across overlay builds; creates no texture or cache, and inexpensive scalar arithmetic does not warrant cross-request result retention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or renderer resource; one returned RGB value belongs to the caller and no task or GPU handle is acquired.
