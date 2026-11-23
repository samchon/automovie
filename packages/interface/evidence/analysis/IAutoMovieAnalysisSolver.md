# src/analysis/IAutoMovieAnalysisSolver.ts#IAutoMovieAnalysisSolver

## @evidence contracts/development/design.md#principled-representation

Identity, version and a one-line governing model are free strings that `validateAutoMovieAnalysisRun` requires to be non-blank and that the run digest joins in fixed order, so changing any of them changes the sealed run.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three strings and no parameter list; what the solver was configured with travels separately as the run's settings digest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing parses the model text or treats a solver id specially in validation or reporting; the accuracy of the stated model rests on the solver that writes it, such as `automovie.envelope.steady-state-1d`.

## @evidence contracts/development/common.md#meaningful-documentation

States why the model must be stated, when the version must change, that all three fields are non-blank and digested, and an example identity.
