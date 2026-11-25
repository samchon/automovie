# src/architecture/IAutoMovieValidateMaterialSubstance.ts#IAutoMovieValidateMaterialSubstance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Range-check one substance record. Member documentation states the supplied records, units and absence meanings used by validateAutoMovieMaterialSubstance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One canonical substance record permits unmeasured properties without fabricated defaults; surface ids are checked as strings but not resolved against materials here.

## @evidence contracts/development/design.md#principled-representation

substance holds optional measured material quantities; null means unmeasured, and validateMaterialSubstance checks each present value against its physical range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateMaterialSubstance.IProps, used by validateAutoMovieMaterialSubstance. Its substance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
