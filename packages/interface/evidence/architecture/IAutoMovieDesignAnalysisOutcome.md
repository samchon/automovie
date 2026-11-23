# src/architecture/IAutoMovieDesignAnalysisOutcome.ts#IAutoMovieDesignAnalysisOutcome

## @evidence contracts/development/design.md#principled-representation

The typed union separates observed candidates from unsupported/not-run reasons. Engine domain validation checks known status, nonempty resolving unique observed claims and nonblank non-observed reasons, but does not inspect extra runtime properties on a non-observed object or prove that the declared execution status is true. Arbitrary nested container shapes remain caller-admitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three variants avoid optional payloads; domain admission refuses an empty observed list even though string[] can express one. Non-observed attempts go to skipped by status; an observed attempt's candidates still pass their separate ordered promotion gates, so observed does not itself imply promoted geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The three status literals are the contract's discriminants, and `promoteDesignObservations` copies a non-observed reason verbatim into `skipped` instead of rewording or dropping it.

## @evidence contracts/development/common.md#meaningful-documentation

States which variant carries readings, how unsupported differs from not-run, that candidates come from the analysed frame only and are named once, and that reasons are non-blank.
