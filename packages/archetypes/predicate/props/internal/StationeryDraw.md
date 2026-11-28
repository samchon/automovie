# src/props/internal/StationeryDraw.ts#StationeryDraw.addPanelContacts

## @evidence contracts/development/common.md#meaningful-documentation

Documents the local panel axes, metric grip inset and optional moving face.

## @evidence contracts/development/implementation.md#principled-implementation

The pinch is centered across the panel, placed halfway up its thickness and inset from the near edge. The upper writing frame follows the optional map fold.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes two frames directly from the three admitted dimensions and the near-edge inset.

# src/props/internal/StationeryDraw.ts#StationeryDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the kind, compatible saved dimensions and paired builder and dimension result.

## @evidence contracts/development/implementation.md#principled-implementation

Admits the selected row's finite settings and merges the clipboard's complete catalogue figures. The builder records provenance from the same draw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructs one draw session, resolves one dimension table and model choice, and prepares one builder.

# src/props/internal/StationeryDraw.ts#StationeryDraw.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

States which groups use free bands and which obtains its dimensions by catalogue choice.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPanel.length

## @evidence contracts/development/common.md#meaningful-documentation

Names the metre-valued model Z axis, ending at the near edge.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPanel.thick

## @evidence contracts/development/common.md#meaningful-documentation

Defines the positive-Y distance from the panel's bottom to its writing surface.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPanel.width

## @evidence contracts/development/common.md#meaningful-documentation

Names the metre-valued extent along X used by the grip span and surface.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the scene ID and the stationery default.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains how the saved kind selects its producer and measurements.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the optional model as a clipboard catalogue choice.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPrepareResult.builder

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the returned builder already carries the draw's measurements.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPrepareResult.d

## @evidence contracts/development/common.md#meaningful-documentation

Specifies that only values from the admitted band or selected catalogue appear.

# src/props/internal/StationeryDraw.ts#StationeryDraw.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Locates the exact saved selectors shared with the gallery and replay.

# src/props/internal/StationeryDraw.ts#StationeryDraw.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Gives the common Esselte geometry, whole row ordering, and published reference sheets.

# src/props/internal/StationeryDraw.ts#StationeryDraw.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared unit record used consistently for bands and whole models.

# src/props/internal/StationeryDraw.ts#StationeryDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Groups the available grips, working faces and joint and edge names.

## @evidence contracts/development/design.md#principled-representation

Separate controls and carrying frames represent real moving pieces of the book and map. Other stationery uses fixed local frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Collects the contact IDs used by stationery and narrows named constructions through their builder type.

# src/props/internal/StationeryDraw.ts#StationeryDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Relates the shared dimension keys to geometry and mass, including pen diameter.

## @evidence contracts/development/design.md#principled-representation

Panel geometry uses model X, Z and Y in metres, and the cylindrical pen reads thickness as diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Band and catalogue shapes share four dimension names, with absent quantities represented by partial records.

# src/props/internal/StationeryDraw.ts#StationeryDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Explains that a whole set of correlated clipboard dimensions and mass is recorded.

## @evidence contracts/development/design.md#principled-representation

One clipboard catalogue row couples the board's three dimensions and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared read-only measurement record allows complete catalogue rows without exposing another unit vocabulary.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPanel

## @evidence contracts/development/common.md#meaningful-documentation

Defines the three continuous dimensions of a panel in the model frame.

## @evidence contracts/development/design.md#principled-representation

Width and length cover the horizontal working surface while thickness determines its positive Y height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups only the dimensions needed by the grip and working-face builder.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains saved kind, scene identity and compatible fixed measurements or clipboard model.

## @evidence contracts/development/design.md#principled-representation

The kind chooses a partial band table or whole model row. The existing saved input retains common numeric units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds one saved recipe shape for replay and for named producers to omit its selector.

# src/props/internal/StationeryDraw.ts#StationeryDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains the relationship between the returned measurements and the builder carrying their provenance.

## @evidence contracts/development/design.md#principled-representation

The caller reads dimensions admitted for the selected kind and builds from the session that recorded them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the two objects the named geometry producer needs from one preparation.

# src/props/internal/StationeryDraw.ts#StationeryDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Enumerates the saved stationery categories.

## @evidence contracts/development/design.md#principled-representation

The five selectors distinguish the stationery configurations that own measurements and contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The original saved selector vocabulary also keys the runtime tables.

# src/props/internal/StationeryDraw.ts#StationeryDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names both recorded Esselte clipboard configurations.

## @evidence contracts/development/design.md#principled-representation

The literals preserve the manufacturer's two catalogue numbers for complete clipboard rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clipboard catalogue owns the only models selectable by this stationery family.
