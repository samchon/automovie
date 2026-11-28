# src/props/internal/WornPropDraw.ts#WornPropDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the inputs and the shared provenance of the returned numeric record and builder.

## @evidence contracts/development/implementation.md#principled-implementation

Reads all four values against the selected form's ranges, then prepares a builder that carries that same draw and scene ID.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw reads one band's complete record and creates one empty builder.

# src/props/internal/WornPropDraw.ts#WornPropDraw.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the shape-specific geometry represented by the common keys and the mass read for each form.

# src/props/internal/WornPropDraw.ts#WornPropDraw.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved selectors used to choose a wearable form.

# src/props/internal/WornPropDraw.ts#WornPropDraw.SHELL

## @evidence contracts/development/common.md#meaningful-documentation

Gives the metric offset used to locate the helmet's crown socket.

# src/props/internal/WornPropDraw.ts#WornPropDraw.STRAP

## @evidence contracts/development/common.md#meaningful-documentation

Names the authored width used by the straight wristwatch strap.

# src/props/internal/WornPropDraw.ts#WornPropDraw.THIN

## @evidence contracts/development/common.md#meaningful-documentation

States the common thickness estimate and its three geometry consumers.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the saved selector owns the active measurement record.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the original stable default scene identity.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IPrepareResult.builder

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the empty model builder retains the adopted draw and ID.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IPrepareResult.d

## @evidence contracts/development/common.md#meaningful-documentation

States the complete set of dimensions and mass returned to the named model.

# src/props/internal/WornPropDraw.ts#WornPropDraw.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the common metre and kilogram vocabulary.

# src/props/internal/WornPropDraw.ts#WornPropDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the real holding, wearing and watch-reading roles.

## @evidence contracts/development/design.md#principled-representation

Each producer positions its hold and wear frame on the actual model. Only the watch owns a dial plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The common contact union is the one used by the concrete builders.

# src/props/internal/WornPropDraw.ts#WornPropDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the units and connects the geometry values to the chosen form's band semantics.

## @evidence contracts/development/design.md#principled-representation

Length values are metric and mass is separate. The form's measure record gives each geometric value its actual axis or shape meaning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four common keys are enough to draw each supported wearable without different serialized dimension names.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved selector, scene identity and finite authorable settings.

## @evidence contracts/development/design.md#principled-representation

The kind chooses the associated physical settings limits and complete dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named builders can pick these same fields without copying measurement definitions.

# src/props/internal/WornPropDraw.ts#WornPropDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the builder and finite dimensions result from the same admitted draw.

## @evidence contracts/development/design.md#principled-representation

The complete record lets each named geometry builder model its form and retain the measurement provenance behind it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result exposes only that admitted record and the builder that needs it.

# src/props/internal/WornPropDraw.ts#WornPropDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the four specific saved wearable forms.

## @evidence contracts/development/design.md#principled-representation

Each literal names a distinct physical shape and corresponding band row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same literal keys drive saved selection and measurement table lookup.
