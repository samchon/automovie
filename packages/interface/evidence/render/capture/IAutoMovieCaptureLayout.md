# src/render/capture/IAutoMovieCaptureLayout.ts#IAutoMovieCaptureLayout

## @evidence contracts/development/design.md#principled-representation

Cell size in pixels, the grid, the sheet count and the reduction are what a sheet writer and a reader of the record need; the budget they came from is kept beside them in the record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the sheet (cell, columns, per sheet, reduction), the record (all, the caption strip included so a reader of the record knows each row's height) and the label stamp (cell).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is a fixed cell size or count; each is computed, and that every count is a positive integer is the planner's invariant.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the bound a sheet obeys and each member's unit.
