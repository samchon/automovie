# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives the hull axes, rower orientation, seat travel, oar carriers, fixed figures and staging estimates.

## @evidence contracts/development/implementation.md#principled-implementation

Each station has an aft-facing seat on its own slider and two opposed footplates. Its separate sweep and dip pivots carry the oar mesh, matching handle and matching tip. The opposed oarlocks use different reference heights.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed measurement record and a bounded shell loft serve both stations. Each station builds the same two-sided articulation recipe with its own identifiers.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record cites separate hull and oar figures and records total mass with four sculls.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional scene ID defaults to `doubleScull`.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The shell and oar dimensions are in metres and the complete mass is in kilograms.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the identifier scheme and shows one seat and one oar carrier chain.

## @evidence contracts/development/design.md#principled-representation

Each name combines an installed station with a seat/slide role or a side with a foot, control, handle or tip role. The same prefix and suffix produce the physical model sites.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model's site type exposes station and side capabilities without exposing shell or oar construction internals.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The keys distinguish shell length and beam, each oar's length, and complete mass.

## @evidence contracts/development/design.md#principled-representation

Three independent length figures shape the shell and oars. The separate mass includes the complete four-oar rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only reference measurements used by shell and oar construction are exposed.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs identify the subject and any explicitly recorded reference figures.

## @evidence contracts/development/design.md#principled-representation

The draw admits fixed values only when they equal their named bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model owns the reference geometry. Callers can carry through known measurements and pick the scene ID.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.Side

## @evidence contracts/development/common.md#meaningful-documentation

The type takes its left and right from the aft-facing rower's viewpoint.

## @evidence contracts/development/design.md#principled-representation

The suffixes map to negative and positive local X respectively when the station builds the feet and locks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One side label applies to the whole per-side contact and oar chain.

# src/vehicles/AutoMovieArchetypeDoubleScull.ts#AutoMovieArchetypeDoubleScull.Station

## @evidence contracts/development/common.md#meaningful-documentation

The type names the forward bow station and aft stroke station.

## @evidence contracts/development/design.md#principled-representation

The exact two prefixes select distinct station positions and their disjoint contact identifiers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shell owns nominal station geometry and the stroke law may address a station by name.
