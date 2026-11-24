# src/physics/preparePhysicalContactTargetRows.ts#preparePhysicalContactTargetRows

## @evidence contracts/development/common.md#meaningful-documentation

States the pose domains and the body ownership of binding, support, floor and avoidance rows.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the unchanged contact/support geometry, self-separation and projected point intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the rows once. A coupled scope only maps candidate identities and selects the external peer reads that can change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The admitted floor, support, point and self rows still contribute to the same measured residual.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes pair selectors and affected keys before probes. Each row then reads its exact geometry directly at the poses it is given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both target fit paths use these rows. The scoped support callbacks use the original local support owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closures borrow the admitted inputs for one fit and retain only local row metadata.
