# src/validation/validateTextureBinding.ts#validateTextureBinding

## @evidence contracts/development/implementation.md#principled-implementation

Admit structured texCoord/color-space/transform-scale bindings against the slot's expected decoding; a legacy asset id string is left alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One binding owner supplies consistent rules to every enumerated material slot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only UV0 is supported; nonzero scale is an explicit policy rather than a loader guess.

## @evidence contracts/development/common.md#meaningful-documentation

Precise transform fault paths are documented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed structured fields and two vector axes take bounded work apart from asset/string diagnostics.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

finiteVector2 and enumValue share field admission, without caching mutable binding objects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only caller-owned faults remain, with no image load, sampler handle or GPU texture acquired.
