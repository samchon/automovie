# src/motion/human/handling/IAutoMovieMotionHumanSheath.ts#IAutoMovieMotionHumanSheath.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the affordances read and the clearance unit.

## @evidence contracts/development/design.md#principled-representation

Affordance ids of the two models and a positive clearance in metres; `HumanSheath.of` refuses an id the models lack and a clearance that is not positive and finite.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member is read once by `HumanSheath.of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member combines with another into an invalid state.

# src/motion/human/handling/IAutoMovieMotionHumanSheath.ts#IAutoMovieMotionHumanSheath.IStaged

## @evidence contracts/development/common.md#meaningful-documentation

Names each subject and the two derived carrier sockets.

## @evidence contracts/development/design.md#principled-representation

Scene subject ids and affordance ids; the line between the two sockets lives on the carrier, so it follows the carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface `HumanSheath.draw` reads every member; `HumanSheath.sheathe` reads all but the handle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Produced only by `HumanSheath.of`, so the sockets exist on the staged carrier.

# src/motion/human/handling/IAutoMovieMotionHumanSheath.ts#IAutoMovieMotionHumanSheath.IStaging

## @evidence contracts/development/common.md#meaningful-documentation

Names the carrier with its derived sockets, the blade mounted on the seat and the staged identities.

## @evidence contracts/development/design.md#principled-representation

Two ordinary performance props and the staged record; the blade's initial mount names the carrier's seat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The author passes both props to `HumanPerformance` and the record to the compositions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The props keep the carrier's own wearing or placement and the blade's own model data.
