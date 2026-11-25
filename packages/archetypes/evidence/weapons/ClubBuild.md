# src/weapons/ClubBuild.ts#ClubBuild.DrawMaterial

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of draw.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only draw and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/weapons/ClubBuild.ts#ClubBuild.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions draw returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/weapons/ClubBuild.ts#ClubBuild.draw

## @evidence contracts/development/common.md#meaningful-documentation

Describes the compatibility draw and the local model it fills.

## @evidence contracts/development/implementation.md#principled-implementation

Admit one model and its fixed dimensions, then draw the dimensions left free and preserve the provenance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keep draw and model assembly together, separate from shape construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserve the published parameter checks and contact conventions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw pass over the profile's bands and one construction pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both independently constructed models share the former club draw.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.

# src/weapons/ClubBuild.ts#ClubBuild.ContactsGrip

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of contacts.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only contacts and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/weapons/ClubBuild.ts#ClubBuild.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States the original model coordinates and the location of the two scene contacts.

## @evidence contracts/development/implementation.md#principled-implementation

The grip frame uses the centre and thickness of the held portion, and the facing surface stays on the positive Z side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Add the shared grasp and positive-Z surface after the producer emits its model parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retain contact coordinates in the model's published resting frame.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The fixed surface pair requires two frame constructions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bat and the inert replica share the saved contact convention.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.
