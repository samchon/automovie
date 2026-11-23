# src/render/capture/IAutoMovieCaptureLayoutProps.ts#IAutoMovieCaptureLayoutProps

## @evidence contracts/development/design.md#principled-representation

The request parser admits the budget.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieCaptureLayout exchanges width, height, count, group, budget, captions; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Captions determine wrapping height; an empty list reserves one line, and a group wider than a row is split.

## @evidence contracts/development/common.md#meaningful-documentation

Raster, reader budget and grouping inputs for contact-sheet planning. planAutoMovieCaptureLayout validates positive safe-integer dimensions/count/group. The prose and members document how planAutoMovieCaptureLayout interprets and admits these values.
