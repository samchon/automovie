# src/architecture/ObstacleDraw.ts#ObstacleDraw.IObstacle

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the measurements and builder returned to each obstacle.

## @evidence contracts/development/design.md#principled-representation

The recorded shape keys refer to the fixed obstacle profile and its selected model dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimensions and builder are the only intermediate outputs needed to construct the selected obstacle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same draw gives construction dimensions and stored provenance.

# src/architecture/ObstacleDraw.ts#ObstacleDraw.begin

## @evidence contracts/development/common.md#meaningful-documentation

Names the original axes and returned builder.

## @evidence contracts/development/implementation.md#principled-implementation

Apply two whole crosstie draws and then validate the selected bands, preserving the recorded figures.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw model axes, draw bands and open the builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A tie dimension set by a section or length remains model-owned; other profiles refuse supplied tie models.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One fixed set of dimension draws.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All obstacle profiles reuse the original draw and dimensional checks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only returns the drawn dimensions and new builder.

# src/architecture/ObstacleDraw.ts#ObstacleDraw.LedgeContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of ledge.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only ledge and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/architecture/ObstacleDraw.ts#ObstacleDraw.ledge

## @evidence contracts/development/common.md#meaningful-documentation

States the two frames and their rectangle's measurements.

## @evidence contracts/development/implementation.md#principled-implementation

Use the top's own dimensions for its surface and put its forward edge at the near boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rectangle gives one surface and one front ledge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A barrier's narrow top supplies the contact depth independently of the full base.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Records two affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three solid obstacles reuse the same surface-and-edge construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the builder receives the contacts.
