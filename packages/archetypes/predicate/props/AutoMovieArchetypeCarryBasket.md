# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.create

## @evidence contracts/development/common.md#meaningful-documentation

States the default size, supported inner floor and actual height and axis of the carrying bar.

## @evidence contracts/development/implementation.md#principled-implementation

The chosen body supplies all three exterior dimensions. The open floor supports its declared rectangle and two posts support the raised bar.

## @evidence contracts/development/implementation.md#efficient-algorithms

Picks one catalogue body and one allowed mass, then constructs a fixed number of body, post and bar primitives.

# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names both exact RISATORP body IDs and why their sizes differ.

## @evidence contracts/development/design.md#principled-representation

Each label selects correlated exterior width, depth and rim height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The literal union represents the two recorded body choices.

# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines that the returned height is the body rim, with physical geometry units and mass.

## @evidence contracts/development/design.md#principled-representation

The site height of the carrying bar is derived above the measured height of the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four keys describe body measurements and mass without adding an independent handle height setting.

# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the inner floor and raised Z-axis bar.

## @evidence contracts/development/design.md#principled-representation

The floor rectangle fits within the body and the bar can be held along its span above the rim.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two IDs expose the actual load-placement and carrying sites.

# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies scene identity, model choice and the mass band.

## @evidence contracts/development/design.md#principled-representation

One model owns the exterior measurements, while the admissible mass may be authored independently.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named recipe exposes the effective choices used by the body constructor.

# src/props/AutoMovieArchetypeCarryBasket.ts#AutoMovieArchetypeCarryBasket.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the complete body selection and its seedless first model.
