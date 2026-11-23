# src/human/generation/leg/IAutoMovieHumanLegStations.ts#IAutoMovieHumanLegStations.IBones

## @evidence contracts/development/common.md#meaningful-documentation

The bones a landmark height is read on.

## @evidence contracts/development/design.md#principled-representation `hip`: Hip centre height, mm. `knee`: Knee centre height, mm. `ankle`: Ankle centre height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegGuides.shape, AutoMovieHumanLegGuides.profile, AutoMovieHumanLegProfile.channel. Also types AutoMovieHumanLegChain.heights, AutoMovieHumanLegGirth.bones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `hip`, `knee`, `ankle`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegStations.ts#IAutoMovieHumanLegStations.Segment

## @evidence contracts/development/common.md#meaningful-documentation

The two segments a landmark can be a share of.

## @evidence contracts/development/design.md#principled-representation

The two segments a landmark can be a share of. The closed alternatives are "thigh", "shank".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegStations.heightAt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegStations.heightAt for the two segments a landmark can be a share of.

# src/human/generation/leg/IAutoMovieHumanLegStations.ts#IAutoMovieHumanLegStations.IBend

## @evidence contracts/development/common.md#meaningful-documentation

A joint's bend along the leg.

## @evidence contracts/development/design.md#principled-representation `at`: Station of the joint, mm. `half`: Half of the bend's length, mm. `range`: The joint's whole range of motion on its flexion channel, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegStations.bends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `half`, `range`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegStations.ts#IAutoMovieHumanLegStations.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the layers are spaced from.

## @evidence contracts/development/design.md#principled-representation `bottom`: Station of the ankle ring, mm. `top`: Station of the crotch ring, mm. `bends`: The joints' bends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegStations.layers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bottom`, `top`, `bends`, `first`, `coarsest`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegStations.ts#IAutoMovieHumanLegStations.RangeChannel

## @evidence contracts/development/common.md#meaningful-documentation

A joint's whole range of motion along its flexion channel, radians.

## @evidence contracts/development/design.md#principled-representation

A joint's whole range of motion along its flexion channel, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegStations.RangeChannel is the canonical exchange used by AutoMovieHumanLegStations.range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegStations.range for a joint's whole range of motion along its flexion channel, radians.
