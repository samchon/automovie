# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.create

## @evidence contracts/development/common.md#meaningful-documentation

States the upright reference, catalogue and band settings, drum default and rim and top contacts.

## @evidence contracts/development/implementation.md#principled-implementation

Selects a complete drum's height and mass or the keg's three bands. One cylinder carries opposed top-rim frames and the stacking outline shares its radius.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw resolves the dimensions. The cylinder, two handles and fixed 16-point outline have fixed construction cost.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States the two barrel shapes and capacities represented.

## @evidence contracts/development/design.md#principled-representation

The selector determines which band row and catalogue applies, the cylinder appearance and the recorded dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One kind chooses the draw and model branch before geometry is emitted.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists both admitted selectors.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names both outward rim holds and the upward stacking contact.

## @evidence contracts/development/design.md#principled-representation

The two handles use radius and height to sit on the cylinder rim, and the stack outline fits the cylinder's upper face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only contacts supported by either generated barrel appear here.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States outside dimensions and empty mass units.

## @evidence contracts/development/design.md#principled-representation

Radius and top height derive from diameter and height in metres. Empty mass follows the selected source and is recorded in kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These three fields directly determine the body and its physical rim and support frames.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies shared geometry and mass units.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.Drum

## @evidence contracts/development/common.md#meaningful-documentation

Names the two sourced Pipeline Packaging drawings.

## @evidence contracts/development/design.md#principled-representation

The names choose complete correlated height and mass pairs while the shared diameter stays in its band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One drawing designation carries both figures for the steel variety.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.DRUMS

## @evidence contracts/development/common.md#meaningful-documentation

States the paired catalogue height and mass and which named drawing comes first.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the options and dimension applicability per barrel kind.

## @evidence contracts/development/design.md#principled-representation

The kind selects its source table, the drum option chooses its pair, and the draw session rejects a fixed recorded figure conflict or out-of-band scalar.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The settings let callers select a real catalogue pair with one name and keep other dimensions in their own bands.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the selector determining catalogue and bands.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States model ownership for drums and the keg's independent bands.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Defines the scene ID and `barrel` default.

# src/furniture/AutoMovieArchetypeBarrel.ts#AutoMovieArchetypeBarrel.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the diameter-only drum band and three adjustable keg dimensions.
