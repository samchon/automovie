# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource

## @evidence contracts/development/common.md#meaningful-documentation

Describes registered generating neck rows and their unchanged calibration-scale and sampling metadata; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Registered generating neck rows and their unchanged calibration-scale and sampling metadata. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanNeckSource; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing NeckSource contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Shared source descriptors, not a loft result or final neck surface.

## @evidence contracts/development/design.md#principled-representation `rows`: The original four rows in rising mean-height order. `head`: Analytic top mean, adopted posterior point and endpoint dx/dy. `bottom`: Bottom generating row's analytic phase mean; not a named base-tape point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeckSource.of. Read by AutoMovieHumanNeckConstruction.generate, AutoMovieHumanNeckConstruction.define, AutoMovieHumanHeadLane.create. Also types AutoMovieHumanBodySources.neckSource, AutoMovieHumanHeadCanonical.lower.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `rows`, `head`, `bottom`, `scale`, `order`, `samples`, `registration`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One original generating row, with dimensions in calibration mm.

## @evidence contracts/development/design.md#principled-representation `ring`: Unmodified dimensionless x/z and millimetre y harmonics. `origin`: Baseline forward and vertical translation before harmonic offsets. `width`: Lateral harmonic scale, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanNeckSource.point, AutoMovieHumanNeckSource.mean. Also types AutoMovieHumanNeckSource.rows, AutoMovieHumanNeckSource.top.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ring`, `origin`, `width`, `depth`, `scale`; callers supply the complete record.
