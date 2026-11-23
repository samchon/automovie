# src/render/capture/IAutoMovieCaptureBudget.ts#IAutoMovieCaptureBudget

## @evidence contracts/development/design.md#principled-representation

The two edges are the reader's own limits in pixels and the reduction is how a still becomes a cell; together they decide cell size, columns and cells per sheet, and the record states them so a reader knows what the sheet was made for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by the layout, the sheet and the record; the grammar parses them from `longest`, `smallest` and `reduction`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reduction is a closed union, not a flag; that `smallest` does not exceed `longest` and both are positive integers is checked by the parser.

## @evidence contracts/development/common.md#meaningful-documentation

States the reader's limits with their source, what each member bounds and the layout rule they drive.
