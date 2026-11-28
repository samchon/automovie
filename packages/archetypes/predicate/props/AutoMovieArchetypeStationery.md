# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.create

## @evidence contracts/development/common.md#meaningful-documentation

Names the five saved kinds, clipboard model, seedless defaults and the retained scene ID.

## @evidence contracts/development/implementation.md#principled-implementation

Validates the saved kind and delegates to the named producer. The saved selectors paper and map resolve to their own paper formats.

## @evidence contracts/development/implementation.md#efficient-algorithms

Chooses one producer and invokes it once, with geometry and measurements resolved by that producer.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Explains why the clipboard has no free band and the other kinds admit fixed dimensions.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.IProducerVariants.map

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the folding-map shape selected by the saved map key.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.IProducerVariants.paper

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shape selected by the saved loose-paper key.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the saved selectors in the order used by the gallery.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

States that the two models share board geometry and have distinct masses.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named factories and the shared producer for paper and map.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.PRODUCER_VARIANTS

## @evidence contracts/development/common.md#meaningful-documentation

States the exact paper-to-sheet and map-to-foldedMap mappings.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the same metres and kilograms apply to free bands and catalogue measurements.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Groups the contact vocabulary by pen, panels, book and map.

## @evidence contracts/development/design.md#principled-representation

The union covers the grip, face and named joints and edge contacts physically supplied by the five models.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes the draw vocabulary through the saved producer. Named models use narrower sets where their results permit it.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines axes and the units shared by the five kinds, including the pen diameter.

## @evidence contracts/development/design.md#principled-representation

The shared record uses metres for geometry and kilograms for mass. Pen thickness denotes its barrel diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One set of physical measurement keys drives both the free bands and catalogue rows.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Defines the correlated dimensions and mass of one catalogue item.

## @evidence contracts/development/design.md#principled-representation

The catalogue supplies one record of measured quantities rather than separately sampled properties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the model owner's partial record of common dimension keys.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the saved selector, scene ID, compatible overrides and clipboard model.

## @evidence contracts/development/design.md#principled-representation

The saved recipe carries optional numeric dimensions so the producer can admit them against that kind's bands. The clipboard has a complete model row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the saved shape from the draw owner and adds no independent measurement record.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.IProducerVariants

## @evidence contracts/development/common.md#meaningful-documentation

Explains the two format lookups needed for saved paper and map selectors.

## @evidence contracts/development/design.md#principled-representation

Both entries map saved selectors to the named paper factory's format type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mapping contains the two keys whose saved spelling carries information the shared callable needs.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Enumerates the saved book, sheet, pen, clipboard and map values.

## @evidence contracts/development/design.md#principled-representation

These are the five accepted selectors in the saved recipe and gallery.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Aliases the draw owner's literal union so saved admission and public typing share the same values.

# src/props/AutoMovieArchetypeStationery.ts#AutoMovieArchetypeStationery.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the two available Esselte clipboard catalogue IDs.

## @evidence contracts/development/design.md#principled-representation

Values preserve the manufacturer's model numbers used to select the board dimensions and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Links directly to the catalogue owner's literal model union.
