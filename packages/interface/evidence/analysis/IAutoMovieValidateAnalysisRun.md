# src/analysis/IAutoMovieValidateAnalysisRun.ts#IAutoMovieValidateAnalysisRun.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate one analysis run as evidence. Member documentation states the supplied records, units and absence meanings used by validateAutoMovieAnalysisRun.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type is a semantic-validation input, not arbitrary JSON admission; malformed nested container shapes can still throw before a violation result exists.

## @evidence contracts/development/design.md#principled-representation

run is a typed analysis record and optional revision requests a staleness check; validateAutoMovieAnalysisRun compares content and digest without repairing the run.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateAnalysisRun.IProps, used by validateAutoMovieAnalysisRun. Its run, revision members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
