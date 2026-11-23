# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange

## @evidence contracts/development/common.md#meaningful-documentation

degrees: The magnitude, degrees; not negative, since the motion gives the sign.

## @evidence contracts/development/design.md#principled-representation

degrees: The magnitude, degrees; not negative, since the motion gives the sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.share, amount); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.table, level); compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.degrees, motion); compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.limit, motion); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.amount, motion); touch/selfAction.ts (selfAction.plan.lift, motion).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange.Level

## @evidence contracts/development/common.md#meaningful-documentation

States what is named; `LEVELS` gives each share.

## @evidence contracts/development/design.md#principled-representation

Five steps from barely to nearly all of a range, ordered so a scale past its bound names the next one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five names, each with a shipped law that uses its share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No level is the whole range: a joint at its limit is an explicit decision on the explicit rung.

# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange.Motion

## @evidence contracts/development/common.md#meaningful-documentation

States what is named; the namespace gives the limit each reads.

## @evidence contracts/development/design.md#principled-representation

The six clinical motions of a three-axis joint, so a law never writes a sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six names, the two ends of the three axes of `IAutoMovieJointConstraint`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union mapped exhaustively to a limit.

# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange.IScaled

## @evidence contracts/development/common.md#meaningful-documentation

States the two members and the scale's range.

## @evidence contracts/development/design.md#principled-representation

The middle rung of an amount: the level keeps the intent and the scale states the correction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `share`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scale is bounded so it cannot stand in for another level.

# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange.IExplicit

## @evidence contracts/development/common.md#meaningful-documentation

States the magnitude's sign rule and what a source is.

## @evidence contracts/development/design.md#principled-representation

The last rung of an amount: a magnitude the motion signs, for a sourced angle no level states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `degrees` and `lean`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The source is required by the type and refused when empty.

# src/motion/human/compose/IAutoMovieMotionHumanRange.ts#IAutoMovieMotionHumanRange.Amount

## @evidence contracts/development/common.md#meaningful-documentation

Names the three rungs; the namespace describes them.

## @evidence contracts/development/design.md#principled-representation

Intent first and degrees on demand: every rung resolves to degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One union of three members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union; the rungs do not nest.
