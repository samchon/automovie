# src/sport/BallBuild.ts#BallBuild.DrawMaterial

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of draw.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only draw and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/sport/BallBuild.ts#BallBuild.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder and the drawn dimensions draw returns, in the family's recorded units.

## @evidence contracts/development/design.md#principled-representation

The builder typed by the caller's contact ids and the draw's own dimension record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members the named producers read after draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional where every call sets it.

# src/sport/BallBuild.ts#BallBuild.draw

## @evidence contracts/development/common.md#meaningful-documentation

Describes the compatibility draw and the local model it fills.

## @evidence contracts/development/implementation.md#principled-implementation

Draw and record the bands using the rulebook measures in metres and kilograms. The material and name belong to the selected shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keep draw and model assembly together, separate from shape construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserve the published parameter checks and contact conventions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw pass over the profile's bands and one construction pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All three shape factories share the dimensions, original names and foreign-dimension refusal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.

# src/sport/BallBuild.ts#BallBuild.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States the short diameter's role and the lowest-point frame.

## @evidence contracts/development/implementation.md#principled-implementation

The grip height is half the model height and the top height equals it. Diameter selects the grip pattern and the contact aperture follows the height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the two contact frames from the height and the grasp policy from the diameter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Use the disc thickness for the puck aperture and retain the original diameter-based grasp policy.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The fixed centre and top contacts each require one frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each ball shape and the puck use the same centre and top frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.
