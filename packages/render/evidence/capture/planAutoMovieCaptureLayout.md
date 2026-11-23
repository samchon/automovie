# src/capture/planAutoMovieCaptureLayout.ts#planAutoMovieCaptureLayout

## @evidence contracts/development/common.md#meaningful-documentation

States both bounds, the proportion and no-enlargement rules, how cells and groups are spread over sheets, which grid wins, the one case that breaks the smallest edge and why, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A sheet holds at most floor(longest / smallest-cell-width) by floor(longest / (smallest-cell-height + its caption strip)) cells, so the strip never pushes a cell under the smallest edge; spreading the count evenly over the fewest such sheets and then choosing the grid by its cell, the tallest whose width fits longest / columns and whose height with its strip fits longest / rows, maximises the cell size within both bounds. The strip's height changes with the cell in steps, its scale with the height and its line count with the width, so the cell is lowered pixel by pixel from the lower of the width-bound height and the row's share until cell and strip fit; the first fit is the largest cell, and the smallest cell's fit, counted with its own strip in the rows a sheet holds, bounds the search. The smallest cell's sides are rounded up, so a grid that fits it keeps the shorter edge at `smallest`, and the chosen cell's sides are floored, so the sheet never exceeds the longest edge; both allow `1e-9` for floating-point error in a size that is whole in exact arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Size the smallest cell, count sheets in whole groups, then one search over column counts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cell size, column count or sheet size is fixed: every number comes from the budget, the raster and the group.

## @evidence contracts/development/implementation.md#efficient-algorithms

The search tries at most one grid per column count, bounded by `longest / smallest`, with lowering steps down to at most the smallest cell, each step wrapping the captions; work is linear in the captions' total length per step and independent of the still's pixels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small record and keeps nothing.
