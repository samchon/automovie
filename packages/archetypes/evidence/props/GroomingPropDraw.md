# src/props/GroomingPropDraw.ts#GroomingPropDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The saved recipe's closed selector.

## @evidence contracts/development/design.md#principled-representation

One literal identifies each saved prop recipe, including stored selections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dispatcher and seeded preparation consume the same names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second producer or geometry is drawn for a saved alias.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.ICartridge

## @evidence contracts/development/common.md#meaningful-documentation

Names each entry of CARTRIDGE, in the constant's own units.

## @evidence contracts/development/design.md#principled-representation

One named number per entry the constant records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the entries the constant's readers use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional entry; every entry is recorded.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The saved contact identifiers for these props.

## @evidence contracts/development/design.md#principled-representation

A closed union covers the contacts built by every shape in this family.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compatibility surface keeps existing contact names while named producers declare the contacts they own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The saved union does not manufacture contact frames absent from a shape.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The saved axis names for drawn dimensions.

## @evidence contracts/development/design.md#principled-representation

Each member records a length, mass, or documented quantity in the associated unit table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records values under the names that existing callers inspect.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The variant and model tables determine which values can be overridden.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The input to the prop recipe.

## @evidence contracts/development/design.md#principled-representation

The optional identifier and dimensions use the existing declared units and per-variant bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries the selection fields and has no separate copied geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Runtime admission rejects refused values and dependent overrides.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Read figures of a manufacturer model.

## @evidence contracts/development/design.md#principled-representation

The optional per-dimension entries describe the figures a model fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records figures on the chosen model axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fields fixed by a model remain fixed by that choice.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

The admitted manufacturer model names.

## @evidence contracts/development/design.md#principled-representation

A closed union identifies each named set of recorded manufacturer dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the saved selector and by the relevant named producer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Model choice retains its original table and selection order.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions prepare returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Prepare an empty builder and the previously recorded careItem dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

The `careItem` draw session uses the original seeds, model table, and bands in their original order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The named producer chooses a kind. This helper handles admission, provenance, and identity before geometry is added.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The session rejects inadmissible overrides or model names and records the values that a producer consumes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws a bounded list of dimensions and prepares one builder.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producers and the saved dispatcher share their exact recipe preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call retains no inputs.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.AddHeadContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of addHead.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only addHead and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.IHead

## @evidence contracts/development/common.md#meaningful-documentation

Names the sizes addHead builds, in metres.

## @evidence contracts/development/design.md#principled-representation

The handle and head lengths and widths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members addHead reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.IHeadColors

## @evidence contracts/development/common.md#meaningful-documentation

Names the two finishes addHead applies.

## @evidence contracts/development/design.md#principled-representation

One colour per built part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members addHead reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/props/GroomingPropDraw.ts#GroomingPropDraw.addHead

## @evidence contracts/development/common.md#meaningful-documentation

Add the handle and flat head of a grooming tool.

## @evidence contracts/development/implementation.md#principled-implementation

The top of the rectangular head marks the face. The cylindrical handle carries the grip between its ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The brush and the razor supply their head measurements and colors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The assembly uses the existing rigid head proxy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds two parts and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The brush and razor share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call retains no inputs.
