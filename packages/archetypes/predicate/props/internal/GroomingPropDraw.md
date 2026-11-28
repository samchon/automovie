# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.addHead

## @evidence contracts/development/common.md#meaningful-documentation

Defines the local layout and both contacts for the handle and working head.

## @evidence contracts/development/implementation.md#principled-implementation

Ends the handle where the head begins. A centred grasp follows the real handle and the upward face uses the head's width and depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates one rod, one box and two contact frames directly from the supplied dimensions.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the selected model constraints and the shared provenance of measurements and builder.

## @evidence contracts/development/implementation.md#principled-implementation

Chooses the owned model before drawing free dimensions. This allows one Alltub diameter to fix width and supply its own applicable length range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates one draw session and one builder for the selected kind, with a single model choice and geometry-value pass.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared per-kind free measurements and the model-dependent length used by the tube.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.BULLET

## @evidence contracts/development/common.md#meaningful-documentation

States the provisional visible bullet length in metres.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.CARTRIDGE

## @evidence contracts/development/common.md#meaningful-documentation

States the estimated planar head measurements and their axes.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.ICartridge.depth

## @evidence contracts/development/common.md#meaningful-documentation

Defines the metric extent from the back to the end of the head along Z.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.ICartridge.width

## @evidence contracts/development/common.md#meaningful-documentation

Defines the metric head span across X.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHead.across

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the metric width of the rectangular head and work surface.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHead.head

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the head's local Z size in metres.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHead.length

## @evidence contracts/development/common.md#meaningful-documentation

Defines the butt-to-tip measurement in metres.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHead.width

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the handle diameter and grasp aperture with their unit.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHeadColors.handle

## @evidence contracts/development/common.md#meaningful-documentation

Identifies which material colour is used for the grip cylinder.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHeadColors.head

## @evidence contracts/development/common.md#meaningful-documentation

Identifies which material colour is used for the head block.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the stable scene identity default.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the selector owns both measurement admission and construction.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names the two catalogue-owning kinds and what each model controls.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IPrepareResult.builder

## @evidence contracts/development/common.md#meaningful-documentation

States the initial builder's shared material, scene ID and draw provenance.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IPrepareResult.d

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the values come from both the chosen model and active band record.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the saved selectors used for replay and gallery order.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Names the correlated quantities and default order for both catalogue-owning kinds.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.TUBE_LENGTHS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the Alltub diameter that indexes each applicable length band.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

States the unit table's role in free measurement bands and model records.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.AddHeadContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the only contacts added by the shared head construction.

## @evidence contracts/development/design.md#principled-representation

The cylindrical hold and working plane correspond to the two authored parts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Narrow builder IDs allow the helper to prepare precisely the contacts used by brush and razor.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Groups the fixed contact roles and the tube-specific cap control.

## @evidence contracts/development/design.md#principled-representation

Each prop has a working end and a hold, while the tube additionally carries its own turning part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared labels represent the union of actual contact IDs across the six variants.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the different physical interpretations of width and the original units for all keys.

## @evidence contracts/development/design.md#principled-representation

The common keys support planar widths and cylindrical diameters without changing the saved measurement vocabulary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw records only the subset applicable to the selected item.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the different correlated quantities present for the two catalogue kinds.

## @evidence contracts/development/design.md#principled-representation

A model supplies tube width or complete razor length and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses partial records over the common dimension keys for both model families.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.ICartridge

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two metric head measurements of the razor proxy.

## @evidence contracts/development/design.md#principled-representation

The two spans form the XZ footprint used by the work face and head block.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only the two cartridge dimensions the razor needs from its published constants.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHead

## @evidence contracts/development/common.md#meaningful-documentation

Defines the assembled length, handle diameter and head footprint.

## @evidence contracts/development/design.md#principled-representation

A head of known depth leaves the remaining length for the gripped cylinder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four geometry inputs are exactly those needed for the shared handle, head and contact frames.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IHeadColors

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the two finish colours.

## @evidence contracts/development/design.md#principled-representation

The cylindrical handle and flat working head can use separate appearances without changing geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two constructed parts require a colour.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved kind, identity, measurements and the applicable model.

## @evidence contracts/development/design.md#principled-representation

The envelope can read historic fields from all six kinds and admission uses the selected prop's tables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record supplies the named builders with shared dimensions and identity.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

States the connection between the numeric result and the builder's draw record.

## @evidence contracts/development/design.md#principled-representation

Geometry can use the admitted numbers while the builder retains the same provenance for authoring and inspection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns one builder and the measurement record its producer consumes.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Enumerates the accepted historic selector values.

## @evidence contracts/development/design.md#principled-representation

Each admitted selector identifies one construction and the corresponding band and model applicability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The exact original union keys the family tables and saved dispatcher.

# src/props/internal/GroomingPropDraw.ts#GroomingPropDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the two groups of names understood by the model selector.

## @evidence contracts/development/design.md#principled-representation

Ten laminate tube rows represent diameter and length-range choices. The two commercial razors fix a paired length and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the recorded commercial model names already admitted by the saved creators.
