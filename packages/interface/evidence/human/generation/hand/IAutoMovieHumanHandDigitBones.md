# src/human/generation/hand/IAutoMovieHumanHandDigitBones.ts#IAutoMovieHumanHandDigitBones

## @evidence contracts/development/common.md#meaningful-documentation

Ordered digit bone directions and millimetre lengths consumed by the digit course builder. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only OnBonesLegs declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

OnBonesLegs separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHandDigitBones exchanges the named OnBonesLegs contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/hand/IAutoMovieHumanHandDigitBones.ts#IAutoMovieHumanHandDigitBones.OnBonesLegs

## @evidence contracts/development/common.md#meaningful-documentation

A digit's line, sections, tip and first section on its legs.

## @evidence contracts/development/design.md#principled-representation

A digit's line, sections, tip and first section on its legs. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandDigitBones.OnBonesLegs is the canonical exchange used by AutoMovieHumanHandDigitBones.onBones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandDigitBones.onBones for a digit's line, sections, tip and first section on its legs.
