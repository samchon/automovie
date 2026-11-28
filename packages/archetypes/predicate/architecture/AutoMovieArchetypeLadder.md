# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.create

## @evidence contracts/development/common.md#meaningful-documentation

Gives actual pitch, approach direction, rung count default and typed refusal cases.

## @evidence contracts/development/implementation.md#principled-implementation

Each rung contact matches its cylinder. The rails follow the same pitch axis with one spacing left above the last rung.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes one ladder axis and adds two rails and one cylinder and bar per rung.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes vertical geometry from the `-Z` leaning variant.

## @evidence contracts/development/design.md#principled-representation

The selected kind chooses a width band and fixes the pitch through equal endpoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two kind labels select the two implemented ladder geometries.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists both accepted ladder kinds in validation order.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.RUNGS

## @evidence contracts/development/common.md#meaningful-documentation

States the maximum 30 and minimum 2 rungs.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names rung and rail contact axes and the rung's material owner.

## @evidence contracts/development/design.md#principled-representation

The numbered bar on each cylinder shares its centre and diameter, and both rail bars follow the signed uphill axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The numbered rungs and two fixed side names cover the available gripping surface.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes lengths, pitch and kilograms per rung.

## @evidence contracts/development/design.md#principled-representation

Spacing, width and diameter place the rods; kind fixes pitch and the per-rung mass sets the total.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One diameter and spacing apply to all appropriate parts, so a ladder needs five dimension keys.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Separates metres, pitch in degrees and mass in kilograms per rung.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains the required kind, optional rung count, bands and ID.

## @evidence contracts/development/design.md#principled-representation

Kind selects the relevant measurement bands, and count sizes both rails around the numbered rungs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The basic construction needs one required selector and allows only ID, count and numeric measurements to vary.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

States the required upright or leaning choice.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.IParams.rungs

## @evidence contracts/development/common.md#meaningful-documentation

Gives the two inclusive integer endpoints and default of 10.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the stable fallback ID `ladder`.

# src/architecture/AutoMovieArchetypeLadder.ts#AutoMovieArchetypeLadder.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

States both sets of width, diameter, spacing, pitch and mass limits.
