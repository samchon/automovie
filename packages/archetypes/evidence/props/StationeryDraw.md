# src/props/StationeryDraw.ts#StationeryDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The saved recipe's closed selector.

## @evidence contracts/development/design.md#principled-representation

One literal identifies each saved prop recipe, including stored selections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dispatcher and seeded preparation consume the same names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second producer or geometry is drawn for a saved alias.

# src/props/StationeryDraw.ts#StationeryDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The saved contact identifiers for these props.

## @evidence contracts/development/design.md#principled-representation

A closed union covers the contacts built by every shape in this family.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compatibility surface keeps existing contact names while named producers declare the contacts they own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The saved union does not manufacture contact frames absent from a shape.

# src/props/StationeryDraw.ts#StationeryDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The saved axis names for drawn dimensions.

## @evidence contracts/development/design.md#principled-representation

Each member records a length, mass, or documented quantity in the associated unit table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records values under the names that existing callers inspect.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The variant and model tables determine which values can be overridden.

# src/props/StationeryDraw.ts#StationeryDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The input to the prop recipe.

## @evidence contracts/development/design.md#principled-representation

The optional identifier and dimensions use the existing declared units and per-variant bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries the selection fields and has no separate copied geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Runtime admission rejects refused values and dependent overrides.

# src/props/StationeryDraw.ts#StationeryDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Read figures of a manufacturer model.

## @evidence contracts/development/design.md#principled-representation

The optional per-dimension entries describe the figures a model fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records figures on the chosen model axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fields fixed by a model remain fixed by that choice.

# src/props/StationeryDraw.ts#StationeryDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

The admitted manufacturer model names.

## @evidence contracts/development/design.md#principled-representation

A closed union identifies each named set of recorded manufacturer dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the saved selector and by the relevant named producer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Model choice retains its original table and selection order.

# src/props/StationeryDraw.ts#StationeryDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions prepare returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/props/StationeryDraw.ts#StationeryDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Prepare an empty builder and the previously recorded stationery dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

The `stationery` draw session uses the original seeds, model table, and bands in their original order.

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

# src/props/StationeryDraw.ts#StationeryDraw.IPanel

## @evidence contracts/development/common.md#meaningful-documentation

Names the panel size addPanelContacts places contacts on, in metres.

## @evidence contracts/development/design.md#principled-representation

The panel width, length and thickness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members addPanelContacts reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/props/StationeryDraw.ts#StationeryDraw.addPanelContacts

## @evidence contracts/development/common.md#meaningful-documentation

Register the edge pinch and working face of a writing surface.

## @evidence contracts/development/implementation.md#principled-implementation

The edge contact follows the panel thickness and the face is at its top.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The clipboard or paper owns the panel and any hinge. This function shares the contact geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The moving paper face rides its own fold while the stack grip stays unposed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds two contact frames.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Paper and clipboard use the same edge pinch and face placement rule.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call retains no inputs.
