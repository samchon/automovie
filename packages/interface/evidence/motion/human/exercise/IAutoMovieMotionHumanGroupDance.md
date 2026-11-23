# src/motion/human/exercise/IAutoMovieMotionHumanGroupDance.ts#IAutoMovieMotionHumanGroupDance.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The dances' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "line", "circle", "conga".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/groupDance.ts (groupDance.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanGroupDance.ts#IAutoMovieMotionHumanGroupDance.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default.

## @evidence contracts/development/design.md#principled-representation

The dance, the tempo in beats per minute, the repeats, the circle's centre in world metres and size, the neighbours by scene id, and the timing variation in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members groupDance.plan and its line, circle and conga courses read; `lock` reuses the dance law's own type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record with members per dance rather than a union on `kind`: the circle's and the conga's members are optional fields the other dances leave unused, and their presence per dance remains for the law.
