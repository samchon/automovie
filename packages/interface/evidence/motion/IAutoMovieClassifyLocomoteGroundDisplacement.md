# src/motion/IAutoMovieClassifyLocomoteGroundDisplacement.ts#IAutoMovieClassifyLocomoteGroundDisplacement.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieClassifyLocomoteGroundDisplacement.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Ground distance is the XZ norm and travel distance the XYZ norm, both metres; alreadyThere and verticalOnly classify those distances using the shared locomotion epsilon after the caller admits finite displacement. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieClassifyLocomoteGroundDisplacement.IResult contract belongs to interface; packages/engine/src/motion/classifyLocomoteGroundDisplacement.ts and packages/engine/src/film/gatePerformShotStageAction.ts use this boundary. Runtime computation remains with those consumers.
