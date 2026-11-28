# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.create

## @evidence contracts/development/common.md#meaningful-documentation

The factory's contract gives the deck lip axes, water and floor references, conditional platform sites, seed behavior and input refusals.

## @evidence contracts/development/implementation.md#principled-implementation

One selected band map establishes the pool geometry. The actual wall part carries a bounded upward deck face and a water-facing wall face. The edge and water frame come from the same lip and freeboard used to construct the wall. The platform face follows the slab's incline.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call draws the selected dimension set once and builds a fixed number of parts and contact frames. The bare edge returns before the starting platform assembly.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record gives the admissible fixed or drawn dimensions for each kind, with reference or estimate provenance.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.ESTIMATES

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the units and distinguishes the referenced platform slab thickness from the staged deck, ledge, setback and grip diameters.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The field identifies the scene subject and defaults to `poolEdge`.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The field selects the bare end wall or the wall with a starting platform.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

The values list the two saved kinds the factory admits.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The record specifies metres for lengths and positions, degrees for slope and kilograms for mass.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the six common identifiers and the three additional starting-platform identifiers.

## @evidence contracts/development/design.md#principled-representation

The six common sites are emitted before branch return. The starting platform adds a sloping face, its front ledge and the backstroke bar.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumers name existing sites. The producer owns their frames, extent, and conditional presence.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The keys distinguish lane width, freeboard, submerged ledge, platform dimensions, slope in degrees and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Freeboard and pool depth determine the floor. The ledge and platform heights use the water level. Per-kind bands restrict fixed values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each scalar drives a geometry, contact or mass choice. `UNITS` supplies the units at the draw boundary.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs identify the edge kind, any fixed in-band measurements and an optional subject ID.

## @evidence contracts/development/design.md#principled-representation

The type shares dimension overrides across the two kinds. The selected band's presence and bound checks admit values at construction. Platform-only overrides on a bare edge are not distinguished statically.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The factory owns seeded dimensions and geometry. Callers choose the installed kind, scene identifier and dimensions they need to fix.

# src/sport/AutoMovieArchetypePoolEdge.ts#AutoMovieArchetypePoolEdge.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The two kinds distinguish the wall and deck from the same edge with a starting platform.

## @evidence contracts/development/design.md#principled-representation

The selected kind is checked against `KINDS` before drawing dimensions and decides whether the platform assembly is built.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One saved choice owns the optional platform geometry and three additional contact sites.
