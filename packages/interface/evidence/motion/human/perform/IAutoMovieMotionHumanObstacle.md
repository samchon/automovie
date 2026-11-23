# src/motion/human/perform/IAutoMovieMotionHumanObstacle.ts#IAutoMovieMotionHumanObstacle

## @evidence contracts/development/common.md#meaningful-documentation

A performance obstacle described by its footprint, vertical extent and optional apertures and film-time motion. Human action planning queries this common scene capability.

## @evidence contracts/development/design.md#principled-representation

footprint: Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. bottom: The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. top: The height its solid ends at, metres above the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Performance input and action contexts share the same obstacle description queried by HumanObstacle and moving-obstacle planning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Footprint, vertical extent and apertures retain their documented metre frames; optional motion is a film-time capability. Obstacle queries own clearance and passage refusal.

# src/motion/human/perform/IAutoMovieMotionHumanObstacle.ts#IAutoMovieMotionHumanObstacle.INeed

## @evidence contracts/development/common.md#meaningful-documentation

breadth: The width it takes, metres: the shoulders' breadth for a body that walks facing its way. height: The height it takes, metres: the stature for a body that stands.

## @evidence contracts/development/design.md#principled-representation

breadth: The width it takes, metres: the shoulders' breadth for a body that walks facing its way. height: The height it takes, metres: the stature for a body that stands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObstacle.ts (HumanObstacle.blocking, need); perform/HumanObstacle.ts (HumanObstacle.judged, need); actions/walkClear.ts (walkClear).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanObstacle.blocking.

# src/motion/human/perform/IAutoMovieMotionHumanObstacle.ts#IAutoMovieMotionHumanObstacle.IBlock

## @evidence contracts/development/common.md#meaningful-documentation

at: Where the path first meets the obstacle's footprint, world metres on the floor. distance: How far along the path that is, metres from its start. short: The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`.

## @evidence contracts/development/design.md#principled-representation

at: Where the path first meets the obstacle's footprint, world metres on the floor. distance: How far along the path that is, metres from its start. short: The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObstacle.ts (HumanObstacle.blocking, return); perform/HumanObstacle.ts (HumanObstacle.judged, return); actions/walkClear.ts (walkClear); actions/walkClear.ts (walkClear.between); perform/HumanObstacle.ts (HumanObstacle.CAUSES); perform/HumanObstacle.ts (HumanObstacle.blocking).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
