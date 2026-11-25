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
