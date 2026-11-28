# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.create

## @evidence contracts/development/common.md#meaningful-documentation

States the radio's battery-dependent body, default catalogue entry and grip and speaker frames.

## @evidence contracts/development/implementation.md#principled-implementation

The selected battery row determines thickness and mass together. The grip spans the actual body height and the speaker covers its +Z face.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates to one catalogue pick, one slab and two contact frames.

# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Defines the battery row and seedless NiMH default.

# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the full-height grip and forward speaker frame.

## @evidence contracts/development/design.md#principled-representation

Grip aperture equals measured case thickness and the speaker covers the entire front. The grip lies at the body midplane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type exposes exactly the two contact names built for the radio.

# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the battery-dependent geometry and mass in their units.

## @evidence contracts/development/design.md#principled-representation

Catalogue dimensions along X, Y and Z size the slab and contact frames, and the selected model records the body mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named producer reports the four physical figures of its whole configuration.

# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States optional scene ID and battery configuration.

## @evidence contracts/development/design.md#principled-representation

An optional model chooses a complete radio row with the same units as all other devices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer exposes the relevant catalogue option alongside scene ownership.

# src/props/AutoMovieArchetypeRadio.ts#AutoMovieArchetypeRadio.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the recorded CP200d battery configurations.

## @evidence contracts/development/design.md#principled-representation

Each model fixes the body's correlated thickness and mass while sharing width and height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One recorded designation chooses the whole configuration and its weight.
