# src/motion/human/lexicon/IAutoMovieMotionHumanTravelCarExit.ts#IAutoMovieMotionHumanTravelCarExit.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Documents the seat, raw cushion width, selected opening, exterior floor, phase timing, landing position and extra flexion.

## @evidence contracts/development/design.md#principled-representation

Bench extent consists of its canonical seat frame, explicit depth and cushion width. The aperture describes its clear opening in the same frame as the exterior floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumed by HumanTravelCarExit.getOut through the registered action parameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Width comes from the physical seat affordance; it is independent of performer size and car class.
