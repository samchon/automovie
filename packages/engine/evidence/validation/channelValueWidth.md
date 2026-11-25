# src/validation/channelValueWidth.ts#channelValueWidth

## @evidence contracts/development/implementation.md#principled-implementation

Node translation/rotation/scale and pointer scalar/vector/quaternion widths come from the canonical channel arms after string and own-key admission; weights depends on a model's morph-target population and has no fixed width here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sampler track shape, artifact shape and light value traversal share one width owner so their strides cannot drift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A weights path, absent from both tables, returns undefined.

## @evidence contracts/development/common.md#meaningful-documentation

Documents width in scalars and variable-width weights.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed discriminator/table lookup takes constant scalar work with no keyframe traversal or output allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One width table serves all consumers without per-track recomputation of shape formulas or cached mutable channel verdicts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar or undefined should transfer; no channel record, model, keyframe array or host handle is retained.
