# src/cinematics/AutoMovieInspectGrammarCutFraming.ts#AutoMovieInspectGrammarCutFraming

## @evidence contracts/development/design.md#principled-representation

The camera-intent framing union or null records a measured shot-boundary size, with null meaning the read could not establish it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

inspectGrammarCut and the film-grammar reader share the camera-intent vocabulary instead of maintaining a second size scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null suppresses size-dependent cut findings; it never substitutes a wide shot or an invented measurement.

## @evidence contracts/development/common.md#meaningful-documentation

States the boundary measurement and the unavailable-result meaning.
