# src/props/KeyboardHardware.ts#KeyboardHardware.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Lists the two stored keyboard forms.

## @evidence contracts/development/design.md#principled-representation

A closed selector chooses the desktop or laptop case.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two forms share the saved keyboard entry point.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selector distinguishes devices with and without a lid.

# src/props/KeyboardHardware.ts#KeyboardHardware.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the typing surfaces and lid contacts in the model frame.

## @evidence contracts/development/design.md#principled-representation

A closed union represents every contact the old dispatcher can return.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The typing contacts are shared and the lid contacts belong to the laptop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The desktop model does not advertise the laptop's contacts.

# src/props/KeyboardHardware.ts#KeyboardHardware.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Lists the base's sizes in metres and the total mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Each dimension has one stated unit for the two measured devices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model records only measurements used to place the base and key field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lid thickness is accounted for in the model's base height.

# src/props/KeyboardHardware.ts#KeyboardHardware.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the saved selector, optional model and model identifier.

## @evidence contracts/development/design.md#principled-representation

The selector binds a whole recorded keyboard or laptop profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The legacy input retains fields originally exposed on saved keyboard records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The draw refuses any dimension override because the two forms have no free dimension bands.

# src/props/KeyboardHardware.ts#KeyboardHardware.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Defines the measured numbers by dimension.

## @evidence contracts/development/design.md#principled-representation

A row carries measured values with dimension-specific units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only reported figures are present in a partial row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One row's mass and sizes stay attached to the same model.

# src/props/KeyboardHardware.ts#KeyboardHardware.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the desktop and laptop records from Apple.

## @evidence contracts/development/design.md#principled-representation

A closed selector selects one complete set of model figures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The selector covers only the explicitly recorded input hardware.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selected form must contain the specified model.

# src/props/KeyboardHardware.ts#KeyboardHardware.DrawContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of draw.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only draw and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/KeyboardHardware.ts#KeyboardHardware.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions draw returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/props/KeyboardHardware.ts#KeyboardHardware.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed result and its local coordinates or dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Use the maker figures and position the key field by the established pitch and margin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared routine owns key geometry and both input devices reuse it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The key field and home row follow the existing size and location contract.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draw one model and place one part and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The laptop and desktop keyboard both use the same key field geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the constructed records and builder.
