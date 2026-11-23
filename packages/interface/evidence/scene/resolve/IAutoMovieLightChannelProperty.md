# src/scene/resolve/IAutoMovieLightChannelProperty.ts#IAutoMovieLightChannelProperty

## @evidence contracts/development/design.md#principled-representation

Represent one supported light axis with its value type, component bounds, light-kind predicate, optional whole-value fault and override writer; the shared table supplies actual rules.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The table co-locates gate admission and playback writing, while sampleClip owns type widths and the scene gate owns staged-light validity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each rule follows the supported light/property pair; this interface does not validate arbitrary implementations or introduce an unsupported axis.

## @evidence contracts/development/common.md#meaningful-documentation

Members describe inclusive bounds, optional collective checks, kind admission and the write preconditions rather than promising unrestricted property assignment.
