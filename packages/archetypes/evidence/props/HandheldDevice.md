# src/props/HandheldDevice.ts#HandheldDevice.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the five saved device forms.

## @evidence contracts/development/design.md#principled-representation

A closed selector chooses one device's specification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the stored device selectors are admitted.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A selector names one form with its own contact contract.

# src/props/HandheldDevice.ts#HandheldDevice.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the contacts and which forms provide them.

## @evidence contracts/development/design.md#principled-representation

The closed union contains the IDs of the saved dispatcher result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result exposes only contacts constructed by the selected form.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing contact cannot be substituted for one a motion requests.

# src/props/HandheldDevice.ts#HandheldDevice.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Lists the outside dimensions in metres and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Numbers on each axis share the dimension's stated unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model draw owns only the outside dimensions and mass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lens never contributes to the camera case's thickness.

# src/props/HandheldDevice.ts#HandheldDevice.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved selector, optional model and model identifier.

## @evidence contracts/development/design.md#principled-representation

The selector binds the recorded model or the free dimension bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This accepts the original saved dispatcher fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The draw refuses dimensions and model choices that the selected form cannot admit.

# src/props/HandheldDevice.ts#HandheldDevice.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Defines measurements keyed by physical dimension.

## @evidence contracts/development/design.md#principled-representation

Each measured value shares the unit of its dimension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only dimensions reported by a source are present in a partial row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One row retains its model's reported values.

# src/props/HandheldDevice.ts#HandheldDevice.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the camera, tablet and radio records.

## @evidence contracts/development/design.md#principled-representation

A closed selector keeps each reported profile intact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model choices belong to the three devices with complete measured data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A model key does not apply to a device that does not list it.

# src/props/HandheldDevice.ts#HandheldDevice.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions draw returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/props/HandheldDevice.ts#HandheldDevice.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Draw the selected band's dimensions before choosing the model and applying its measured figures.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The draw owns the dimensions and provenance before the producer builds parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The selected kind supplies dimensions through bands, measured figures, or both. Inadmissible model and dimension inputs are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draw at most four dimensions and select one model.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved and named callers share the draw namespace and records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.

# src/props/HandheldDevice.ts#HandheldDevice.caseBody

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Place one box half its height above the origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The case contributes only the shared material geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The breadth and depth are the drawn outside dimensions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Add one box.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rectangular case serves shallow and tall devices.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.

# src/props/HandheldDevice.ts#HandheldDevice.front

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Place the translation at half-depth along positive Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The case frame is available to both shared and specialized contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The position is local to the upright case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build one facing frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The four slab producers use the same front coordinate frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.

# src/props/HandheldDevice.ts#HandheldDevice.SmallGripsContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of smallGrips.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only smallGrips and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/HandheldDevice.ts#HandheldDevice.smallGrips

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Use the built case thickness for both apertures and preserve the stated local grasp positions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function declares both common phone and remote grasps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pinch height is the existing estimate and length follows the case width.

## @evidence contracts/development/implementation.md#efficient-algorithms

Return two contact records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both producers reuse material dimensions and grasp geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.

# src/props/HandheldDevice.ts#HandheldDevice.FaceContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the face contact ids in the signature of fullFace.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only fullFace and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/HandheldDevice.ts#HandheldDevice.FaceAndGrip

## @evidence contracts/development/common.md#meaningful-documentation

Names the contacts fullFace builds for one face.

## @evidence contracts/development/design.md#principled-representation

The grip id joined with the generic face id the caller selects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only fullFace and the tablet and radio producers read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It adds no contact beyond the grip and the selected face.

# src/props/HandheldDevice.ts#HandheldDevice.FullFaceKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of fullFace.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only fullFace and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/props/HandheldDevice.ts#HandheldDevice.fullFace

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Build the case and place the back grip and front surface on it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The caller identifies the model table and names its front contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grip and face dimensions use the drawn slab dimensions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build one part and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Tablet and radio share the slab and grip construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.
