# src/motion/human/sport/IAutoMovieMotionHumanFieldThrow.ts#IAutoMovieMotionHumanFieldThrow

## @evidence contracts/development/common.md#meaningful-documentation

event: The throw. implement: Scene id of the held implement. area: Scene id of the throwing circle or the javelin runway (`createThrowingCircle`). distance: The recorded result, metres from the circle's inside edge or the arc to the landing mark.

## @evidence contracts/development/design.md#principled-representation

event: A closed union. implement and area: scene ids. distance: Metres along the throw, the outcome taken as input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGymnastics.ts (HumanGymnastics.fieldThrow, params); sport/fieldThrow.ts (fieldThrow.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No release speed is authored: it follows from the distance and is bounded by the event's measured ceiling.

# src/motion/human/sport/IAutoMovieMotionHumanFieldThrow.ts#IAutoMovieMotionHumanFieldThrow.Event

## @evidence contracts/development/common.md#meaningful-documentation

Names the four events.

## @evidence contracts/development/design.md#principled-representation

A closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The events the law's table covers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/sport/IAutoMovieMotionHumanFieldThrow.ts#IAutoMovieMotionHumanFieldThrow.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The event, two scene ids and a distance in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The distance is the outcome; the law refuses one the event cannot reach.
