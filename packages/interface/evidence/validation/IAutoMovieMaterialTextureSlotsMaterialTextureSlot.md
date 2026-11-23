# src/validation/IAutoMovieMaterialTextureSlotsMaterialTextureSlot.ts#IAutoMovieMaterialTextureSlotsMaterialTextureSlot

## @evidence contracts/development/common.md#meaningful-documentation

Represent one borrowed image binding with its material-relative path and required decoding. Member documentation states the supplied records, units and absence meanings used by autoMovieRenderTextureDigest, materialTextureSlots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row is slot metadata rather than a loaded or validated image; legacy bare-id bindings use the slot's declared decoding requirement.

## @evidence contracts/development/design.md#principled-representation

path is relative to the owning material, binding borrows its canonical image binding, and colorSpace is restricted to srgb or linear decoding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieMaterialTextureSlotsMaterialTextureSlot, used by autoMovieRenderTextureDigest, materialTextureSlots. Its path, binding, colorSpace members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
