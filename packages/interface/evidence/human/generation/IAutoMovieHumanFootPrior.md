# src/human/generation/IAutoMovieHumanFootPrior.ts#IAutoMovieHumanFootPrior

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanFootPrior exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IToe, IPrior. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanFootPrior; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IToe, IPrior contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanFootPrior.ts#IAutoMovieHumanFootPrior.IToe

## @evidence contracts/development/common.md#meaningful-documentation

One toe.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name; `{side}` stands for the side. `tip`: Tip `[a, u]`. `head`: Across place of the toe's line at its metatarsal head, `u`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootToeCap.t, AutoMovieHumanFootToeSpan.t.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `tip`, `head`, `height`, `breadth`, `depth`, `pulp`, `joints`, `order`, `sections`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootPrior.ts#IAutoMovieHumanFootPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The prior.

## @evidence contracts/development/design.md#principled-representation `yaw`: The foot axis turned out from forward, radians. `expected`: Dimensions when none are given: ANSUR II women's and men's ratios and lines, mixed by the masculine-feminine control. `ring`: Height of the ankle ring, the leg's start, per lateral malleolus height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootConstruction.prior, AutoMovieHumanFootPrior.PRIOR.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `yaw`, `expected`, `ring`, `ankle`, `first`, `cascade`, `clefts`, `toes`, `malleoli`, `toeDorsal`; callers supply the complete record.
