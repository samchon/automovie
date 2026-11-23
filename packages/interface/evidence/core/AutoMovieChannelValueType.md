# src/core/AutoMovieChannelValueType.ts#AutoMovieChannelValueType

## @evidence contracts/development/design.md#principled-representation

Mirrors the glTF accessor element types; `channelValueWidth` reads the fixed widths from one table that both the sampler and the artifact gate use, and `channelIsRotation` selects slerp for `quaternion` exactly as glTF requires for rotation tracks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed literal union carries the one fact a pointer cannot express by itself, its width and interpolation family, while a node channel derives both from its `path` instead of repeating this tag.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unknown value type throws in `channelIsRotation` rather than defaulting to lerp, and `weights` is left unchecked by width instead of being assumed to hold one entry.

## @evidence contracts/development/common.md#meaningful-documentation

States the width each member fixes, why `quaternion` is separate from `vec4`, and that `weights` is variable-width and unchecked.
