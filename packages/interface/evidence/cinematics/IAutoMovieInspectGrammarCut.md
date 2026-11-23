# src/cinematics/IAutoMovieInspectGrammarCut.ts#IAutoMovieInspectGrammarCut.IThresholds

## @evidence contracts/development/design.md#principled-representation

The angle is degrees between subject-to-camera bearings and displacement is Euclidean world metres. Both are finite positive runtime premises checked by readFilmGrammar, with no enforced upper bound on the angle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two cut-rule thresholds vary; shot-size measurement and shot observations are supplied separately to inspectGrammarCut.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Thresholds remain caller data rather than constants tied to a film, and equality belongs to the non-finding side of both strict comparisons.

## @evidence contracts/development/common.md#meaningful-documentation

Gives units, default/admission owner, strict comparison boundaries and the observation-only scope.
