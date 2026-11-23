# src/index.ts#reliefWeightFragment

## @evidence contracts/development/implementation.md#principled-implementation

Expands the installed native normal-map chunk when present, requires its actual slope-scale boundary and inserts unchanged interpolated relief multiplication immediately after it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A source transformation remains separate from vertex interpolation and material registration, preserving downstream detail/overlay ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing slope target refuses instead of silently leaving slopes unchanged; common-marker presence and tangent-normal compilation profile remain required and generated text alone is not device shading proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents native chunk expansion, required scale boundary and why unsupported source must refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of includes/replacements scans S shader bytes and creates proportional returned strings; no texel or vertex data is copied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equivalent source/installed native chunk gives equivalent text, while native program reuse belongs to the material stable-key chain rather than a mutable local cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only temporary and returned strings exist; no GPU shader/program or material lifetime is acquired by this helper.
