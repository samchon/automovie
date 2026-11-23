# src/analysis/IAutoMovieAnalysisWarning.ts#IAutoMovieAnalysisWarning

## @evidence contracts/development/design.md#principled-representation

An open-code record that `validateAutoMovieAnalysisRun` checks for a non-blank code and detail and a null or non-blank subject; the run digest serializes each warning as one JSON tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A string code rather than a closed union, because warnings are advisory and the summarizer neither counts nor branches on them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A warning cannot stand in for a failure: an input that makes a metric unmeasurable must produce a gap, and only the solved arm of an outcome has a warning list.

## @evidence contracts/development/common.md#meaningful-documentation

States where warnings may appear, that statuses ignore them, the codes the engine emits today, and when the subject is null.
