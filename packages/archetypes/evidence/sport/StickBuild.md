# src/sport/StickBuild.ts#StickBuild.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions draw returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/sport/StickBuild.ts#StickBuild.draw

## @evidence contracts/development/common.md#meaningful-documentation

Describes the compatibility draw and the local model it fills.

## @evidence contracts/development/implementation.md#principled-implementation

Each sport uses its own cited bands and the retained model coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keep draw and model assembly together, separate from shape construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserve the published parameter checks and contact conventions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw pass over the profile's bands and one construction pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the dimension checks and composite material of the four sports profiles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.

# src/sport/StickBuild.ts#StickBuild.ContactsSymmetry

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of contacts.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only contacts and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/sport/StickBuild.ts#StickBuild.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States the shaft span, measured playing face and aperture options.

## @evidence contracts/development/implementation.md#principled-implementation

The grip spans the shaft above the working end. The blade's outward normal follows the local face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Put one affordance on the shaft and one affordance on the face.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keep the measured head and face anchors. Retain the absence of an aperture on the cricket handle.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The fixed grip and face each contribute one frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shaft and face frames are common to four shapes. Each shape supplies its own face position and width.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.
