# src/human/generation/IAutoMovieHumanToothPlacement.ts#IAutoMovieHumanToothPlacement

## @evidence contracts/development/common.md#meaningful-documentation

One placed tooth.

## @evidence contracts/development/design.md#principled-representation `name`: Part name: `upper|lower.left|right.<tooth>`. `crown`: Crown's dimensions. `jaw`: Jaw that carries it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouth.teeth, AutoMovieHumanMouth.canine.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `crown`, `jaw`, `neck`, `axis`, `along`, `out`; callers supply the complete record.
