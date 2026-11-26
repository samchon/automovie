# src/human/generation/IAutoMovieHumanNeckPrior.ts#IAutoMovieHumanNeckPrior.IRing

## @evidence contracts/development/common.md#meaningful-documentation

One layer's ring as harmonics of its phase.

## @evidence contracts/development/design.md#principled-representation `x`: Forward place over the depth: cosines from the constant term. `z`: Lateral place over the width: sines from the first. `y`: Height off the ring's mean, mm: cosines from the constant term.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanNeckSource.perimeter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `x`, `z`, `y`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanNeckPrior.ts#IAutoMovieHumanNeckPrior.ISize

## @evidence contracts/development/common.md#meaningful-documentation

A size per layer.

## @evidence contracts/development/design.md#principled-representation `level`: Log of the size over the tape read there. `sex`: Per unit of the masculine-feminine control. `gain`: Per unit of the log of the tape read there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanNeckSource.size.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `level`, `sex`, `gain`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanNeckPrior.ts#IAutoMovieHumanNeckPrior.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

A place per layer.

## @evidence contracts/development/design.md#principled-representation `level`: Forward place, mm. `sex`: Per unit of the masculine-feminine control.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanNeckPrior.IPlace is the canonical exchange used by IAutoMovieHumanNeckPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `level`, `sex`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanNeckPrior.ts#IAutoMovieHumanNeckPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The prior.

## @evidence contracts/development/design.md#principled-representation `order`: Control points of a section. `samples`: Uniform phases of the rings. `width`: Half width per layer, from the bottom.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanNeckPrior.PRIOR, AutoMovieHumanNeckSource.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `order`, `samples`, `width`, `depth`, `place`, `drop`, `rings`; callers supply the complete record.
