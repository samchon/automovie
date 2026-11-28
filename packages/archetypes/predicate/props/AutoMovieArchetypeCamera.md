# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.create

## @evidence contracts/development/common.md#meaningful-documentation

States the body frame and model default, two-handed geometry, front lens projection and rear screen.

## @evidence contracts/development/implementation.md#principled-implementation

One catalogue entry sets the body dimensions. A box and grip cylinder make the body and a second cylinder supplies the 20 mm front lens extension. Grip, support, screen, lens and shutter use those actual size and axis conventions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One catalogue draw supplies three solids and five contacts. All offsets use the same derived case dimensions.

# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names selection of the whole row and the seedless Ricoh default.

# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the grip bar, downward support, opposed lens and screen and top button.

## @evidence contracts/development/design.md#principled-representation

The grip follows the -X rod and support attaches to the underside region at +X. Lens and screen face opposite directions and the shutter is on top.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result exposes the five generated handling and viewing frames.

# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes case and added lens depth and names each unit.

## @evidence contracts/development/design.md#principled-representation

The catalogue fixes width, height, case thickness and mass. The lens's added projection is defined by the geometry owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimension record carries the sourced case values needed by the builder.

# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the catalogue draw and optional object ID.

## @evidence contracts/development/design.md#principled-representation

One optional closed model choice selects the relevant full row, with undefined allowing a draw.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The options expose catalogue selection and scene ownership.

# src/props/AutoMovieArchetypeCamera.ts#AutoMovieArchetypeCamera.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names both admitted compact-camera catalogue rows.

## @evidence contracts/development/design.md#principled-representation

A model label selects recorded width, height, body thickness and mass as one configuration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One model option carries all four measured figures.
