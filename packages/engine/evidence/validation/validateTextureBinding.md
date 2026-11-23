# src/validation/validateTextureBinding.ts#validateTextureBinding

## @evidence contracts/development/implementation.md#principled-implementation

Admit legacy nonblank asset ids or structured texCoord/color-space/transform/sampler bindings against the slot's expected decoding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One binding owner supplies consistent rules to every enumerated material slot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

OnlyUV0 is supported; finite nonzero scale and closed sampler menus are explicit policies rather than loader guesses.

## @evidence contracts/development/common.md#meaningful-documentation

Unknown/null record shapes and precise transform/sampler fault paths are documented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed structured fields and two vector axes take bounded work apart from asset/string diagnostics.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

finiteVector2 and enumValue share field admission, without caching mutable binding objects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only caller-owned faults remain, with no image load, sampler handle or GPU texture acquired.
