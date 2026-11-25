# src/props/LongImplementDraw.ts#LongImplementDraw.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The saved recipe's closed selector.

## @evidence contracts/development/design.md#principled-representation

One literal identifies each saved prop recipe, including stored selections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dispatcher and seeded preparation consume the same names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second producer or geometry is drawn for a saved alias.

# src/props/LongImplementDraw.ts#LongImplementDraw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The saved contact identifiers for these props.

## @evidence contracts/development/design.md#principled-representation

A closed union covers the contacts built by every shape in this family.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compatibility surface keeps existing contact names while named producers declare the contacts they own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The saved union does not manufacture contact frames absent from a shape.

# src/props/LongImplementDraw.ts#LongImplementDraw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The saved axis names for drawn dimensions.

## @evidence contracts/development/design.md#principled-representation

Each member records a length, mass, or documented quantity in the associated unit table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records values under the names that existing callers inspect.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The variant and model tables determine which values can be overridden.

# src/props/LongImplementDraw.ts#LongImplementDraw.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The input to the prop recipe.

## @evidence contracts/development/design.md#principled-representation

The optional identifier and dimensions use the existing declared units and per-variant bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries the selection fields and has no separate copied geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Runtime admission rejects refused values and dependent overrides.

# src/props/LongImplementDraw.ts#LongImplementDraw.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Read figures of a manufacturer model.

## @evidence contracts/development/design.md#principled-representation

The optional per-dimension entries describe the figures a model fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded preparation records figures on the chosen model axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fields fixed by a model remain fixed by that choice.

# src/props/LongImplementDraw.ts#LongImplementDraw.Model

## @evidence contracts/development/common.md#meaningful-documentation

The admitted manufacturer model names.

## @evidence contracts/development/design.md#principled-representation

A closed union identifies each named set of recorded manufacturer dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the saved selector and by the relevant named producer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Model choice retains its original table and selection order.

# src/props/LongImplementDraw.ts#LongImplementDraw.IPrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions prepare returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/props/LongImplementDraw.ts#LongImplementDraw.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Prepare an empty builder and the previously recorded longTool dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

The `longTool` draw session uses the original seeds, model table, and bands in their original order.

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

# src/props/LongImplementDraw.ts#LongImplementDraw.GroundToolContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of groundTool.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only groundTool and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/LongImplementDraw.ts#LongImplementDraw.GroundToolBuilt

## @evidence contracts/development/common.md#meaningful-documentation

Names the contacts `groundTool` builds.

## @evidence contracts/development/design.md#principled-representation

The two contact ids `groundTool` always builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the producers of ground tools join their own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/props/LongImplementDraw.ts#LongImplementDraw.IGroundHead

## @evidence contracts/development/common.md#meaningful-documentation

Names the head block groundTool builds, in metres.

## @evidence contracts/development/design.md#principled-representation

The block size, finish and relative density the construction reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members groundTool reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/props/LongImplementDraw.ts#LongImplementDraw.IGroundShaft

## @evidence contracts/development/common.md#meaningful-documentation

Names the shaft groundTool builds, in metres.

## @evidence contracts/development/design.md#principled-representation

The radius and top height the construction reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members groundTool reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/props/LongImplementDraw.ts#LongImplementDraw.groundTool

## @evidence contracts/development/common.md#meaningful-documentation

Build the head and two-hand shaft of a ground-contact implement.

## @evidence contracts/development/implementation.md#principled-implementation

Place the bottom face at the origin and the shaft above the head. The long grip spans exactly the clear shaft.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The owning producer supplies the head and the top of the shaft in the object frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Heads remain coarse blocks. The broom, mop and shovel own their distinct dimensions and mass proportions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds two parts and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three producers share the same shaft and face construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call retains no inputs.
