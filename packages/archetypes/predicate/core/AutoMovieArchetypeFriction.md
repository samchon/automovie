# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.IRange.minimum

## @evidence contracts/development/common.md#meaningful-documentation

Names the lower coefficient bound used by the midpoint calculation.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.IRange.maximum

## @evidence contracts/development/common.md#meaningful-documentation

Names the upper coefficient bound used by the midpoint calculation.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.undeclared

## @evidence contracts/development/common.md#meaningful-documentation

The parameters name the requesting producer, model and missing part. The result identifies the surface choices of the model.

## @evidence contracts/development/implementation.md#principled-implementation

The function constructs a parameter refusal with axis surface and the actual declared part names. The caller that knows which part was requested can throw the returned refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads only the provided surface names once and constructs one refusal. The rest of the model and its geometry are untouched.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.Material

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the narrower set of surfaces used by measured friction.

## @evidence contracts/development/design.md#principled-representation

The literals include the ordinary support and contact surfaces used by the current friction records. A typed material still needs a measured pair because not every combination has data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The friction-only API uses these material names for measured ground and part pairs. The broader physical vocabulary remains owned by the material catalogue.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.GROUND

## @evidence contracts/development/common.md#meaningful-documentation

The constant identifies concrete as the default reference ground for a declared resting surface.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.ICoefficients

## @evidence contracts/development/common.md#meaningful-documentation

The alias identifies a source-backed material pair and reuses its data contract.

## @evidence contracts/development/design.md#principled-representation

The underlying type preserves static values, optional kinetic values and source text on each measured row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The friction and general material readers use the same row rather than copying the representation.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.IRange

## @evidence contracts/development/common.md#meaningful-documentation

The fields name the smallest and largest coefficients of the selected range.

## @evidence contracts/development/design.md#principled-representation

The two named bounds support the scalar-value operation. Range validation belongs to the source of the supplied range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The midpoint helper needs these two coefficient bounds without a catalogue key or surface identity.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.PAIRS

## @evidence contracts/development/common.md#meaningful-documentation

This view exposes the same immutable table as the material owner, keyed by the sorted names joined by a slash.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.pair

## @evidence contracts/development/common.md#meaningful-documentation

The function accepts the two surface roles in either order. The result gives coefficients with source conditions, and an absent pair raises a refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates name ordering, measured lookup and refusal to the general material owner. Tests exercise the same public row for reversed operands and a reliably unmeasured pair.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one delegated lookup. The returned row is borrowed and the function has no separate cache or copy.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.value

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the scalar or bounded input and states that the range result is its arithmetic midpoint.

## @evidence contracts/development/implementation.md#principled-implementation

A scalar is returned as supplied. For a bounded input, equal distance from both endpoint values defines the representative value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the scalar or two bounds and performs a single midpoint calculation. The result contains no retained data.
