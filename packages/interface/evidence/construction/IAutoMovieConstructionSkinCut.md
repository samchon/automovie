# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut

## @evidence contracts/development/common.md#meaningful-documentation

States the region, the smooth minimum with its bound and derivatives, the residual and the rail's jets.

## @evidence contracts/development/design.md#principled-representation

One generating curve for a shared boundary: the skin's own intersection with a declared surface, exact with its jets, which the rail cycle, the band's edge and the crossing between them all read (construction.md, Connections: Ownership).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plane record and input describe one cut. The cut publishes its station-jet reader, optional point reader and station bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A phase without a crossing, already past the surface or tangent to it is refused with its phase; nothing is clamped to the face's end or refitted.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.IPlane

## @evidence contracts/development/design.md#principled-representation

A point and a unit normal toward the kept half space.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; the caller resolves the declared frame and normalizes.

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the kept side.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.IInput

## @evidence contracts/development/design.md#principled-representation

The skin, the planes with their rounding, the side the band stands on and the face's own stations determine the curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fields; the stations and the sample count are sampling inputs the caller already owns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; admission of the declaration belongs to the caller.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and role.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.ICut

## @evidence contracts/development/design.md#principled-representation

The curve's station with two derivatives at any phase, its world point there when provided, and its station bounds at admitted phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both reads address the same cut by phase. One interval records the sampled station extent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both readers solve the residual on the skin at the supplied phase and require the same directed crossing.

## @evidence contracts/development/common.md#meaningful-documentation

States the station-jet and point units, their shared root and the interval's source.
