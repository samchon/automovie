# src/human/generation/foot/IAutoMovieHumanFootMalleolusWindow.ts#IAutoMovieHumanFootMalleolusWindow

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanFootMalleolusWindow exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput, IPlace. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanFootMalleolusWindow; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput, IPlace contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/foot/IAutoMovieHumanFootMalleolusWindow.ts#IAutoMovieHumanFootMalleolusWindow.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a window's place reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `body`: The body whose guide the malleolus stands on. `which`: Which border.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootMalleolusWindow.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `body`, `which`, `height`, `radius`, `sign`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootMalleolusWindow.ts#IAutoMovieHumanFootMalleolusWindow.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

A window's place.

## @evidence contracts/development/design.md#principled-representation `stations`: The stations the window covers, lowest first. `phases`: The phases it covers, in the side's ring order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootMalleolusWindow.of. Also types AutoMovieHumanFootMalleolus.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `phases`; callers supply the complete record.
