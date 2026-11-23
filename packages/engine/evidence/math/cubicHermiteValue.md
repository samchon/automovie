# src/math/cubicHermiteValue.ts#cubicHermiteValue

## @evidence contracts/development/implementation.md#principled-implementation

Four cubic Hermite basis terms interpolate endpoints and derivatives; key-time span converts per-second tangents to normalized-segment derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Playback and range proofs share this polynomial owner so their tangent scaling cannot drift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither time nor tangents are clamped, preserving authored interpolation and caller-controlled extrapolation.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies outgoing/incoming tangent ownership, derivative units, span scaling and shared sampler/range-proof responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Squared and cubed time are computed once for a fixed four-term polynomial, requiring constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All basis terms reuse the same time powers; no sampled component is cached across changing times.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar powers and the returned component exist, without retained keys, tangents or sample history.
