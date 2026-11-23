# src/human/generation/foot/IAutoMovieHumanFootToeSpan.ts#IAutoMovieHumanFootToeSpan

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanFootToeSpan exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IToe, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanFootToeSpan; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IToe, IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/foot/IAutoMovieHumanFootToeSpan.ts#IAutoMovieHumanFootToeSpan.IToe

## @evidence contracts/development/common.md#meaningful-documentation

A toe on its line, left frame.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name; `{side}` stands for the side. `order`: Control points of a section. `sections`: Sections of the toe's chain (`AutoMovieHumanFootToeStations`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeSpan.of. Read by AutoMovieHumanFootToeChain.of, AutoMovieHumanFootToeChain.nail, AutoMovieHumanFootToeStations.of. Also types AutoMovieHumanFootConstruction.toes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `order`, `sections`, `head`, `tangent`, `size`, `first`, `cap`, `pole`, `lateral`, `nail`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootToeSpan.ts#IAutoMovieHumanFootToeSpan.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a toe's span reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Every toe's line, hallux first. `index`: Which toe, 0 for the hallux.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootToeSpan.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `lines`, `index`; callers supply the complete record.
