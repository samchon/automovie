# src/motion/human/carrier/IAutoMovieMotionHumanSupportTransfer.ts#IAutoMovieMotionHumanSupportTransfer

## @evidence contracts/development/common.md#meaningful-documentation

Names both load-bearing surfaces, the deck-local landing station, the first foot and the film interval.

## @evidence contracts/development/design.md#principled-representation

Each endpoint pairs a prop subject with a model-local surface id. The deck station is in that surface's XZ plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

supportTransfer consumes the endpoints, docking mode, landing station, order and duration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses existing surface affordances and keeps docking, reach and foot placement admission in the transfer planner.

# src/motion/human/carrier/IAutoMovieMotionHumanSupportTransfer.ts#IAutoMovieMotionHumanSupportTransfer.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a declared surface and its owning prop.

## @evidence contracts/development/design.md#principled-representation

One prop id scopes one affordance id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two ids suffice to resolve the support frame and footprint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing prop and affordance ids.
