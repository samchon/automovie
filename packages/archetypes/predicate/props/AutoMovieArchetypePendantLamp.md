# src/props/AutoMovieArchetypePendantLamp.ts#AutoMovieArchetypePendantLamp.create

## @evidence contracts/development/common.md#meaningful-documentation

The cord runs along `-Y`. The shade's `light` socket points down from its mouth at the combined cord and shade depth.

## @evidence contracts/development/implementation.md#principled-implementation

The origin fixes the ceiling hook, and the total cord and shade length determines the downward source point.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one pendant record and creates a cord, shade and three local contacts directly.

# src/props/AutoMovieArchetypePendantLamp.ts#AutoMovieArchetypePendantLamp.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Ceiling `hook`, side shade `grip` and downward `light` at the mouth.

## @evidence contracts/development/design.md#principled-representation

The suspension and emitted beam are at opposite ends, while the shade grip lies halfway up the shade.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes three separate roles for mounting, holding and placing a light source.

# src/props/AutoMovieArchetypePendantLamp.ts#AutoMovieArchetypePendantLamp.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Cord drop, shade height and shade diameter in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

The cord and shade height add along negative Y, and the shade diameter sets the lateral grip aperture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned quantities describe the two suspended parts and their mass.

# src/props/AutoMovieArchetypePendantLamp.ts#AutoMovieArchetypePendantLamp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Optional ID, finite cord drop, shade height and diameter in metres, and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Uses dimensional bounds tied to the hanging construction, including the separate cord drop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Offers the applicable pendant fields from the saved light shape.
