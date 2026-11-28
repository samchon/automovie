# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.create

## @evidence contracts/development/common.md#meaningful-documentation

States the catalogue, model axes, 48 inch default and both returned contacts.

## @evidence contracts/development/implementation.md#principled-implementation

The selected catalogue row supplies length and mass together. A solid case uses the common measured depth and height and supplies the upper and forward-edge frames.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates to one catalogue selection, one solid case and two contacts. The procedure has no geometric work proportional to the number of catalogue entries after selection.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the two catalogue IDs and their respective case lengths.

## @evidence contracts/development/design.md#principled-representation

The closed choice set selects one complete width and mass pair per entry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One authored model key controls both correlated figures.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes length in metres from empty mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Length supplies the case extent and contact widths. Mass supplies body properties. The selected model records both together.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two varying catalogue dimensions are returned in this record.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared dimension units used by the catalogue records and resulting geometry.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

States both width and mass pairs, the source and the seedless order.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

States the upper surface and its forward X edge.

## @evidence contracts/development/design.md#principled-representation

Both contacts coincide with the physical case's upper plane. The ledge sits on the customer face boundary at half depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two names correspond to the solid model's supported surface interactions.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.DOORS

## @evidence contracts/development/common.md#meaningful-documentation

States the current absence of recorded door dimensions and the generated case closure.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the supported catalogue and scene identification settings.

## @evidence contracts/development/design.md#principled-representation

An optional closed model name selects the complete pair. Omission permits the seed or the first catalogue entry to determine it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Authoring chooses one model and one ID while the catalogue owns their physical dimensions.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States the explicit catalogue choice and first model fallback.

# src/furniture/AutoMovieArchetypeShowcase.ts#AutoMovieArchetypeShowcase.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the scene object ID and its default.
