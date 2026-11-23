# src/motion/human/compose/IAutoMovieMotionHumanSite.ts#IAutoMovieMotionHumanSite

## @evidence contracts/development/common.md#meaningful-documentation

weight: Its relative weight, positive. low: The lowest place a hand may hold, metres from the handle's base. high: The highest, metres from the handle's base; at least `low`.

## @evidence contracts/development/design.md#principled-representation

weight: Its relative weight, positive. low: The lowest place a hand may hold, metres from the handle's base. high: The highest, metres from the handle's base; at least `low`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw, sites); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw, s); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.draw.total, s); compose/AutoMovieMotionHumanSite.ts (AutoMovieMotionHumanSite.grasp, band).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanSite.draw.

# src/motion/human/compose/IAutoMovieMotionHumanSite.ts#IAutoMovieMotionHumanSite.IWeighted

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and range.

## @evidence contracts/development/design.md#principled-representation

An id and a positive weight, a categorical distribution's entry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by `draw`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The weight is relative; no total is stored.

# src/motion/human/compose/IAutoMovieMotionHumanSite.ts#IAutoMovieMotionHumanSite.IBand

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The two ends of the part of a handle a hand may hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by `grasp`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The band is the affordance's; nothing is assumed of its length.
