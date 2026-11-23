# src/human/generation/foot/IAutoMovieHumanFootToeBreadth.ts#IAutoMovieHumanFootToeBreadth

## @evidence contracts/development/common.md#meaningful-documentation

Describes toe-line geometry and independent versus neighbour-constrained half-breadth readers; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Toe-line geometry and independent versus neighbour-constrained half-breadth readers. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootToeBreadth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootToeBreadth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/foot/IAutoMovieHumanFootToeBreadth.ts#IAutoMovieHumanFootToeBreadth.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the breadth reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Every toe's line, hallux first. `index`: Which toe, 0 for the hallux.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootToeBreadth.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `lines`, `index`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootToeBreadth.ts#IAutoMovieHumanFootToeBreadth.IBreadth

## @evidence contracts/development/common.md#meaningful-documentation

A toe's line and breadth.

## @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex. `length`: The line's length, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeBreadth.of. Read by AutoMovieHumanFootToeCap.of, AutoMovieHumanFootToeRoot.of. Also types AutoMovieHumanFootToeSpan.breadth.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `head`, `tip`, `length`, `tangent`, `pointAt`, `shape`, `half`; callers supply the complete record.
