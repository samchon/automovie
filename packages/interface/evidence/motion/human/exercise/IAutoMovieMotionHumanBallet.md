# src/motion/human/exercise/IAutoMovieMotionHumanBallet.ts#IAutoMovieMotionHumanBallet.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The steps' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "position", "pirouette", "grandJete".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/balletStep.ts (balletStep.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanBallet.ts#IAutoMovieMotionHumanBallet.Movement

## @evidence contracts/development/common.md#meaningful-documentation

Held, bent over the toes, or risen onto the balls.

## @evidence contracts/development/design.md#principled-representation

Closed choices "hold", "plie", "releve".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/balletPositions.ts (balletPositions.course).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanBallet.ts#IAutoMovieMotionHumanBallet.Direction

## @evidence contracts/development/common.md#meaningful-documentation

The two turning directions.

## @evidence contracts/development/design.md#principled-representation

Closed choices "enDehors", "enDedans".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/balletPirouette.ts (balletPirouette.course).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanBallet.ts#IAutoMovieMotionHumanBallet.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default, and which values the law refuses.

## @evidence contracts/development/design.md#principled-representation

The step, the position and movement, the turnout and split in degrees, the turns and the tempo in beats per minute.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members balletStep.plan and its position, pirouette and jeté courses read; `lock` reuses the dance law's own type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record with members per step kind rather than a union on `kind`: a member only another step uses is not refused by step kind; ranges and the hip limits remain for balletStep.plan's runtime refusals.
