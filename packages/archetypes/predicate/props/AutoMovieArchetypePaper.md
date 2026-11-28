# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.create

## @evidence contracts/development/common.md#meaningful-documentation

Documents the default sheet, fold travel and which contacts move with the panel, including the normal at full opening.

## @evidence contracts/development/implementation.md#principled-implementation

Uses an upper writing face and near pinch for either format. The map models two half-thickness layers, with one hinge carrying the moving upper panel and its contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects one format and prepares one admitted dimension draw. Only the map adds an upper layer, fold and two layer frames.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.FORMATS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the admitted values and their gallery order.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IFoldedMapParams.format

## @evidence contracts/development/common.md#meaningful-documentation

Names the required selector for the two-layer hinged map.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.format

## @evidence contracts/development/common.md#meaningful-documentation

States the available shape choice and the effect of omission.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the default scene ID for both shapes.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.length

## @evidence contracts/development/common.md#meaningful-documentation

States the metre-valued head-to-foot axis and the selected format's band.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.mass

## @evidence contracts/development/common.md#meaningful-documentation

Specifies kilograms for the entire prop and the applicable band.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.thickness

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes whole closed thickness from map layer thickness.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams.width

## @evidence contracts/development/common.md#meaningful-documentation

Names the X dimension in metres and its applicable band.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.ISheetParams.format

## @evidence contracts/development/common.md#meaningful-documentation

Explains the typed value and the default for callers that omit it.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the common contacts and the map-specific fold and layer grips.

## @evidence contracts/development/design.md#principled-representation

The map's physical roles distinguish the moving edge from the stationary support, with a shared face and near-edge handle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union extends the common paper contact vocabulary with three controls needed by the hinged construction.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States that the returned dimensions measure closed size in metres and whole mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

All four dimensions describe the undeformed prop. The map derives layer size from the same total thickness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both formats publish the same measured keys, while the format selects their numeric bands.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.Format

## @evidence contracts/development/common.md#meaningful-documentation

Names the flat and hinged shapes accepted by the factory.

## @evidence contracts/development/design.md#principled-representation

The literals distinguish the geometric topologies and their contact sets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One selector drives band choice, modelling and contact availability.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IFoldedMapParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the hinged map and its moving upper panel.

## @evidence contracts/development/design.md#principled-representation

Its required format selects map bands and a two-layer model with articulated map contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the shared finite measurements and scene ID with the one map selector.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains the optional ID, format and applicable fixed values.

## @evidence contracts/development/design.md#principled-representation

Both formats use the same units and measurement axes, with a shape-specific admission table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares one record of dimensions across the format overloads.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.ISheetParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the loose-sheet overload and its default.

## @evidence contracts/development/design.md#principled-representation

The optional literal represents both explicit sheet choice and the default shape when the format is omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the common parameter shape and narrows only the field that determines the returned contacts.

# src/props/AutoMovieArchetypePaper.ts#AutoMovieArchetypePaper.SheetAffordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the pinch and working face of a loose sheet.

## @evidence contracts/development/design.md#principled-representation

The sheet has a single upper plane with a near-edge grip and no moving layers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The narrow sheet result exposes two semantically usable contacts.
