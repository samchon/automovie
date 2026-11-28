# src/props/internal/HandToolDraw.ts#HandToolDraw.handle

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the handle's axis, metric units, approach frame and actual selectable grip characteristics.

## @evidence contracts/development/implementation.md#principled-implementation

The handle geometry and grasp share a radius. Its grip covers the lesser of physical length and the hand span, at the selected end.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates one cylinder and resolves one contact directly from the length, radius and explicit options.

# src/props/internal/HandToolDraw.ts#HandToolDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Explains the applicable saved settings and paired finite measurements and builder result.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the selected kind's bands and complete knife measurements, retaining one draw record in the geometry builder.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw session reads the applicable dimensions and catalogue once and creates an empty builder.

# src/props/internal/HandToolDraw.ts#HandToolDraw.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the per-kind measurements and the values supplied by a complete knife model.

# src/props/internal/HandToolDraw.ts#HandToolDraw.BLADE_DEPTH

## @evidence contracts/development/common.md#meaningful-documentation

Defines the metric span from blade back to its working tooth ledge.

# src/props/internal/HandToolDraw.ts#HandToolDraw.BOWL

## @evidence contracts/development/common.md#meaningful-documentation

Names the estimated radius and its use as the spoon bowl disc.

# src/props/internal/HandToolDraw.ts#HandToolDraw.GRIP

## @evidence contracts/development/common.md#meaningful-documentation

Gives the maximum grasp length, relevant physical limit and source for its value.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the saved scene ID and stable default.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the selector's control over the body and applicable measurements.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Identifies table knife catalogue ownership and optional draw behavior.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IPrepareResult.builder

## @evidence contracts/development/common.md#meaningful-documentation

States that the prepared builder holds the original scene identity and measurement record.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IPrepareResult.d

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the admitted values cover free dimensions and one model's own figures.

# src/props/internal/HandToolDraw.ts#HandToolDraw.ITines.length

## @evidence contracts/development/common.md#meaningful-documentation

States the tines proxy extent along Y with metre units.

# src/props/internal/HandToolDraw.ts#HandToolDraw.ITines.width

## @evidence contracts/development/common.md#meaningful-documentation

States the tines proxy span across X with metre units.

# src/props/internal/HandToolDraw.ts#HandToolDraw.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the saved kinds used by the gallery and common table.

# src/props/internal/HandToolDraw.ts#HandToolDraw.KNIFE_THICKNESS

## @evidence contracts/development/common.md#meaningful-documentation

Defines the blade thickness ratio as a function of measured width.

# src/props/internal/HandToolDraw.ts#HandToolDraw.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Introduces the two measured knife rows, both complete, and the seedless first choice.

# src/props/internal/HandToolDraw.ts#HandToolDraw.TINES

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the two independent dimensions of the authored fork tines.

# src/props/internal/HandToolDraw.ts#HandToolDraw.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit vocabulary shared by drawn and model-owned values.

# src/props/internal/HandToolDraw.ts#HandToolDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the two roles the family builds in the selected shape's frame.

## @evidence contracts/development/design.md#principled-representation

The same IDs designate the physical grasp and actual work frame for each chosen model.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two shared names let narrow named models expose their own geometry behind the same roles.

# src/props/internal/HandToolDraw.ts#HandToolDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States all admitted shared measurement names and physical units.

## @evidence contracts/development/design.md#principled-representation

Different tools interpret blade as plate or shank length. All geometry shares metres, and total mass stays in kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One finite key vocabulary serves both the selected bands and complete catalogue figures.

# src/props/internal/HandToolDraw.ts#HandToolDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Names the correlated four measurements from a model row.

## @evidence contracts/development/design.md#principled-representation

A single knife label fixes its overall and blade dimensions plus its recorded mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The catalogue uses the common finite measurement keys for both knife choices.

# src/props/internal/HandToolDraw.ts#HandToolDraw.HandleContact

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the grip and working IDs present on the prepared tool shape.

## @evidence contracts/development/design.md#principled-representation

The shared handle owns its grip and passes through the named tool's builder for the separate working contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The helper uses the same two IDs already owned by the finished tool.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains the saved scene fields and the one model-owning tool kind.

## @evidence contracts/development/design.md#principled-representation

Saved values retain common units and remain subject to the selected body's applicable measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One recipe envelope supports the original selectors while named callers pick the fields that apply.

# src/props/internal/HandToolDraw.ts#HandToolDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains the shared provenance of the returned builder and settings.

## @evidence contracts/development/design.md#principled-representation

The prepared producer reads the applicable quantities while the builder adopts their draw record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the builder and numeric record needed by named producers are returned.

# src/props/internal/HandToolDraw.ts#HandToolDraw.ITines

## @evidence contracts/development/common.md#meaningful-documentation

Names the two dimensions of the fork's plate proxy.

## @evidence contracts/development/design.md#principled-representation

A tines plate's width crosses X and its length advances along the utensil's Y axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups the only two tines dimensions used by that plate construction.

# src/props/internal/HandToolDraw.ts#HandToolDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Groups the saved hand tools, cutlery and stage prop selectors.

## @evidence contracts/development/design.md#principled-representation

Each selector identifies a single model recipe and its applicable measurement record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The complete set of eight literals drives both saved selection and dimension lookup.

# src/props/internal/HandToolDraw.ts#HandToolDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the exact saved manufacturer labels.

## @evidence contracts/development/design.md#principled-representation

Each label selects a complete knife whose shape and mass are coupled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Includes the two labels actually admitted by the model owner.
