# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.create

## @evidence contracts/development/common.md#meaningful-documentation

States the paper card's plain material, axes, fixed size and thickness-sized grip.

## @evidence contracts/development/implementation.md#principled-implementation

One thin slab lies face down and supplies both stack heights. Its measured thickness sets the gripping aperture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one box and uses the common three-contact construction.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.ICard.length

## @evidence contracts/development/common.md#meaningful-documentation

Locates and quantifies the longer edge in metres.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.ICard.mass

## @evidence contracts/development/common.md#meaningful-documentation

States the per-card mass in kilograms.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.ICard.thickness

## @evidence contracts/development/common.md#meaningful-documentation

States the estimated physical thickness and hence stacking height.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.ICard.width

## @evidence contracts/development/common.md#meaningful-documentation

Locates and quantifies the shorter edge in metres.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable default scene identity.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Upper `grip` and `top` socket, with `base` at the underside centre.

## @evidence contracts/development/design.md#principled-representation

The top and base share the model's centerline and the pinch lies on the upper card face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two sockets and one grip provide the required mounting and pickup roles.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Width along X, length along Z and thickness along Y in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

The two in-plane dimensions are separate from layer thickness, which determines the stack separation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four keys capture the actual slab dimensions and its estimated mass.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.ICard

## @evidence contracts/development/common.md#meaningful-documentation

Fixed metric playing-card dimensions and estimated mass.

## @evidence contracts/development/design.md#principled-representation

The metric quantities describe the rectangular slab in its own coordinate frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record supplies the precise three axes and mass needed for this card.

# src/props/AutoMovieArchetypePlayingCard.ts#AutoMovieArchetypePlayingCard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID as the authored option.

## @evidence contracts/development/design.md#principled-representation

The stable recipe owns geometry and mass, so a caller can distinguish instances through its ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameter type contains one optional scene identity.
