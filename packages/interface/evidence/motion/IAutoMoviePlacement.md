# src/motion/IAutoMoviePlacement.ts#IAutoMoviePlacement

## @evidence contracts/development/design.md#principled-representation

A start offset plus a local-time motion is sufficient to place authored keyframes on the shot clock without rewriting or duplicating the clip's duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The schedule entry carries only timing and the borrowed motion; arrangeMotion owns ordering, gap holds and combined output.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shot placement uses explicit seconds, not a clip-name or actor-specific timing convention.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes shot-clock start from clip-local time and points consumers to the arranger's gap and overlap policy.
