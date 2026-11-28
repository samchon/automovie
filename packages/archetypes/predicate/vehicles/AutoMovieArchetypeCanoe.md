# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.create

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the forward-facing seats, waterline convention, catalogue and seed behavior, and inadmissible values.

## @evidence contracts/development/implementation.md#principled-implementation

The public function delegates to the canoe construction. The selected hull and layup supply catalogue dimensions and mass, then both thwart surfaces use the same admitted height above the hull bottom. The outfitter puts one toward the bow and one toward the stern.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shared boat construction sets geometry, with a bounded canoe outfit that adds exactly two thwarts.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.IParams.layup

## @evidence contracts/development/common.md#meaningful-documentation

The field selects a layup that the chosen hull offers, or its first option when unseeded and omitted.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

The field selects a canoe catalogue hull, or its first entry when unseeded and omitted.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the six contact identifiers produced by the canoe.

## @evidence contracts/development/design.md#principled-representation

The shared alias includes other boat sites. The canoe outfit emits only its two thwarts along with the four common hull contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The boat type owns common keys and installed canoe geometry supplies exactly its own frames.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the canoe's recorded measures and their metre and kilogram units.

## @evidence contracts/development/design.md#principled-representation

This alias inherits shared boat keys beyond the six values canoe construction actually records. The canoe bands and catalogue choose the active subset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sharing the boat record lets existing boat APIs consume the model; the canoe constructor exposes only seat height as an author-fixed numeric option.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The comment names scene ID, hull, layup and seat height in metres.

## @evidence contracts/development/design.md#principled-representation

The hull type is canoe specific. Compatible layups and the seat height band are validated during construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer reuses common ID and seat-height fields and owns the narrower hull catalogue.

# src/vehicles/AutoMovieArchetypeCanoe.ts#AutoMovieArchetypeCanoe.Model

## @evidence contracts/development/common.md#meaningful-documentation

The four literals name the admitted canoe hull choices.

## @evidence contracts/development/design.md#principled-representation

Each saved ID maps to a whole hull in the canoe catalogue and restricts the available layups.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dedicated canoe manufacturer data owns hull dimensions and compatible layups.
