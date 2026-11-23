# src/production/IAutoMovieMotionTakeAnchor.ts#IAutoMovieMotionTakeAnchor

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the two clocks, zero-based occurrence and the side that owns a hard seam.

## @evidence contracts/development/design.md#principled-representation

Stores one occurrence and both clock coordinates so reopening can check placement as well as source identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps source selection with film admission; the record needs no timeline, solver or renderer state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Repeated uses of a shot are distinguished by entry, and transitions require selection at admission instead of treating the blended sample as a source.
