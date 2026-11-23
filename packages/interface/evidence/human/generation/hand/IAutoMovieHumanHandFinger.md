# src/human/generation/hand/IAutoMovieHumanHandFinger.ts#IAutoMovieHumanHandFinger

## @evidence contracts/development/common.md#meaningful-documentation

A digit standing on its bones, in the left frame, millimetres.

## @evidence contracts/development/design.md#principled-representation `joints`: Its joints from its MCP: MCP, PIP and DIP for a finger, MCP and IP for the thumb. `points`: Centre line from its start, one point every {@link IAutoMovieHumanHandFinger.step} of its length. `step`: Spacing of the points along the line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFingerBones.of, AutoMovieHumanHandDigitBones.onBones, AutoMovieHumanHandFingers.digitsOf. Read by AutoMovieHumanHandDigitChain.fingerOf, AutoMovieHumanHandSolve.knuckleSection. Also types AutoMovieHumanFingerBones.out, AutoMovieHumanHandConstruction.fingers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `joints`, `points`, `step`, `line`, `shape`, `ring`, `first`, `cap`, `pole`, `external`, `windows`, `nail`; callers supply the complete record.
