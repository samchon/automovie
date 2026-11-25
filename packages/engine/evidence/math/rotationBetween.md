# src/math/rotationBetween.ts#rotationBetween

## @evidence contracts/development/implementation.md#principled-implementation

Normalized directions supply cross-product sine and dot-product cosine to atan2 for a shortest arc; exact collinearity selects identity or a deterministic perpendicular half-turn without an angular deadzone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct and prepare entries share one normalized-direction turn core, so analytic/iterative callers and repeated two-bone aims have one scaling/collinearity owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact zero sine alone selects collinearity; prepare snapshots only one normalized source and still normalizes every target through the same core, with no new threshold or fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

The direct path normalizes two directions; prepare normalizes its source once and omits that work/allocation per target, retaining constant cross/dot/atan2/axis-angle work and no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both angle coordinates share normalized directions; prepare additionally owns a normalized source snapshot independent of later caller edits. No target, angle, quaternion result or object-identity key is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct direction/cross/result records are call-local. One prepared closure owns one normalized vector until caller release; each target/output remains local with no global state, history or handles.

## @evidence contracts/development/common.md#meaningful-documentation

States finite-input premises, shortest-arc/collinear conventions and precision limits; prepare's child documents owned source snapshot, later source mutation behavior and fresh target results.
