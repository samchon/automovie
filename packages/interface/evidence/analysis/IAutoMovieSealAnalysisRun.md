# src/analysis/IAutoMovieSealAnalysisRun.ts#IAutoMovieSealAnalysisRun.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Seal one run: digest the settings, check the record, and digest it only once it is known to validate. Member documentation states the supplied records, units and absence meanings used by sealAutoMovieAnalysisRun.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The inputs do not pretend that a digest freezes borrowed solver/outcome data or proves collision-free identity; settings text is reduced to its digest in the output.

## @evidence contracts/development/design.md#principled-representation

id, domain, subject and inputRevision identify one run; settings is canonical text while solver and outcome remain borrowed records. sealAutoMovieAnalysisRun checks contents before computing the digest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieSealAnalysisRun.IProps, used by sealAutoMovieAnalysisRun. Its id, domain, subject, inputRevision, solver, settings, outcome members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
