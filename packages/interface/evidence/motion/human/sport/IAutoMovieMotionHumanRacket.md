# src/motion/human/sport/IAutoMovieMotionHumanRacket.ts#IAutoMovieMotionHumanRacket.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The position, the hand and the hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/sport/IAutoMovieMotionHumanRacket.ts#IAutoMovieMotionHumanRacket.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the original solo positions and the named sport-specific stroke set.

## @evidence contracts/development/design.md#principled-representation

Position and Stroke are separate closed unions routed to their respective planners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/racketCases.ts (racketCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in racketCases.

# src/motion/human/sport/IAutoMovieMotionHumanRacket.ts#IAutoMovieMotionHumanRacket.Position

## @evidence contracts/development/common.md#meaningful-documentation

The cases are the stance, the preparatory hop and the golf address.

## @evidence contracts/development/design.md#principled-representation

Three named parameter cases dispatch through racket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains the original position choices.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One case per supported position.

# src/motion/human/sport/IAutoMovieMotionHumanRacket.ts#IAutoMovieMotionHumanRacket.Stroke

## @evidence contracts/development/common.md#meaningful-documentation

Names each stroke by its sport and action.

## @evidence contracts/development/design.md#principled-representation

The closed set defines the supported court stroke profiles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One value per implemented stroke.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Court stroke dimensions and paths remain in the owning law.
