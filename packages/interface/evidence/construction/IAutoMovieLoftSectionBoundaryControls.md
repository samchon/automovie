# src/construction/IAutoMovieLoftSectionBoundaryControls.ts#IAutoMovieLoftSectionBoundaryControls

## @evidence contracts/development/design.md#principled-representation

Three eight-entry rows hold log extents and logit shoulders with first and second derivatives per physical station mm; extent logs use kernel-mm numeric values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

LoftSectionBoundary produces and validates these rows for its positive native scalar bridge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The arrays do not enforce length eight or finiteness; control admission checks them and the original endpoint binding.

## @evidence contracts/development/common.md#meaningful-documentation

Defines row order, transformed quantities and physical derivative clock.
