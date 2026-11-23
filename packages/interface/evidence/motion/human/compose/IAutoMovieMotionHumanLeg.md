# src/motion/human/compose/IAutoMovieMotionHumanLeg.ts#IAutoMovieMotionHumanLeg.Frame

## @evidence contracts/development/common.md#meaningful-documentation

States what each argument is, when the function is called and the result's frame.

## @evidence contracts/development/design.md#principled-representation

A foot that follows something (a swing path, a pivot about its ball) is a function of the posture so far and the time, evaluated when the row is written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function type, taken by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed placement is the constant function, so there is no second form for it.

# src/motion/human/compose/IAutoMovieMotionHumanLeg.ts#IAutoMovieMotionHumanLeg.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its unit.

## @evidence contracts/development/design.md#principled-representation

The span the leg is written over, where the foot is at each second and whether it bears then.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by `place`; `plant` and `step` fill them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bearing is a function of seconds, so a foot that lands inside the span needs no second primitive.
