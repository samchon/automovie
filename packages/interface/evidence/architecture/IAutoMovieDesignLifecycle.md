# src/architecture/IAutoMovieDesignLifecycle.ts#IAutoMovieDesignLifecycle

## @evidence contracts/development/design.md#principled-representation `validateDesignLineage` resolves the subject and both phase ids, refuses a second lifecycle for one subject or a subject with none, and, when both ends are set, requires the installing phase among the removing phase's transitive `requires` collected by breadth-first walk.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two nullable phase ids carry the whole lifecycle; the role and per-phase presence are derived from them by `designLineagePhaseSnapshot` instead of being stored a second time.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A subject missing a lifecycle is refused rather than given a predates-and-survives default, and an incomparable install and removal on parallel branches is refused rather than ordered by array position.

## @evidence contracts/development/common.md#meaningful-documentation

States the one-per-subject totality and why, what null means at each end, and the strict transitive ordering both ends must satisfy.
