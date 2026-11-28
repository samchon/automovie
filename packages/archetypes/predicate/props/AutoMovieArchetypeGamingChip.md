# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.create

## @evidence contracts/development/common.md#meaningful-documentation

States the disc's orientation, fixed size and full-diameter pinch.

## @evidence contracts/development/implementation.md#principled-implementation

The actual disc thickness separates the centered stack sockets and diameter determines the grasp.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one short cylinder and adds the shared stack frames directly.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IChip.diameter

## @evidence contracts/development/common.md#meaningful-documentation

States the model's estimated diameter and its metric unit.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IChip.mass

## @evidence contracts/development/common.md#meaningful-documentation

States the chip's fixed mass in kilograms.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IChip.thickness

## @evidence contracts/development/common.md#meaningful-documentation

States the disc's estimated stacking height.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable default scene identity.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Upper `grip` and `top` socket, and centered underside `base` socket.

## @evidence contracts/development/design.md#principled-representation

The underside and upper socket centers sit on the physical disc faces. The grip uses disc diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same three contacts support both solo pickup and mounting within a stack.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Disc diameter and thickness in metres, and whole mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The disc requires one diameter and its Y thickness. Mass is separate from those physical dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three keys cover the fixed model's actual dimensions and weight.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IChip

## @evidence contracts/development/common.md#meaningful-documentation

The fixed chip cross-section and mass.

## @evidence contracts/development/design.md#principled-representation

The two disc quantities define its single cylinder, which also carries its recorded whole mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed recipe uses the three quantities published by the producer.

# src/props/AutoMovieArchetypeGamingChip.ts#AutoMovieArchetypeGamingChip.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID as the authored option.

## @evidence contracts/development/design.md#principled-representation

The stable recipe owns geometry and mass, so a caller can distinguish instances through its ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameter type contains one optional scene identity.
