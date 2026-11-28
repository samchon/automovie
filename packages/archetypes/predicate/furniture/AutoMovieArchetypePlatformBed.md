# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.create

## @evidence contracts/development/common.md#meaningful-documentation

States the headboard axis, platform dimensions, default top and long-edge contacts.

## @evidence contracts/development/implementation.md#principled-implementation

The body support height is the mattress top minus thickness. The mattress and upward surface use that common top, and side frames sit at its physical X edges.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw produces three boxes and three contacts. The selected width changes their dimensions without more parts.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States both widths and their common mattress length.

## @evidence contracts/development/design.md#principled-representation

The selected width is supported by the single or double band row, with matching mass range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One variant key controls the platform geometry and its matching bands.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the mattress geometry, floor height and mass units.

## @evidence contracts/development/design.md#principled-representation

The platform uses mattress extents, an independently drawn top height and its empty mass. Its base height follows from the difference between top and thickness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimension surface is restricted to the platform body and its mattress.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the top and opposing side seats and their axes.

## @evidence contracts/development/design.md#principled-representation

The upright top uses the mattress plane. The two seats sit on the X edges and align across the physical mattress length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the frame names emitted by the platform are carried by this type.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the required size and optional fixed bands or ID.

## @evidence contracts/development/design.md#principled-representation

The discriminator determines platform width and mass interval. The shared fixed fields retain their metre or kilogram bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Selects the applicable subset of saved settings without a separate catalogue option.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the selected platform width and mass band.

# src/furniture/AutoMovieArchetypePlatformBed.ts#AutoMovieArchetypePlatformBed.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists both valid kind values.
