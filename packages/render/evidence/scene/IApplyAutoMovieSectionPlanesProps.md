# src/index.ts#IApplyAutoMovieSectionPlanesProps

## @evidence contracts/development/design.md#principled-representation

Separates the borrowed renderer switch, existing scene subtree and engine world-space remove-side half-spaces so applyAutoMovieSectionPlanes converts clipping convention without altering authored geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One props record keeps clipping application inputs together; the narrow renderer interface exposes only the mutable switch this operation needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty planes mean release for every subtree; no geometry deletion or special scene identity is encoded in the input.

## @evidence contracts/development/common.md#meaningful-documentation

Members state renderer mutation, caller ownership of root/geometry, world-space convention and empty-list release behavior.
