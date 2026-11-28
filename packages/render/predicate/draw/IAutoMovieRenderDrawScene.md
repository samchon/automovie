# src/draw/IAutoMovieRenderDrawScene.ts#IAutoMovieRenderDrawScene

## @evidence contracts/development/common.md#meaningful-documentation

Describes the scene lifetime and the source-owned played cue records the subject can supply.

## @evidence contracts/development/design.md#principled-representation

The scene carries ready-to-draw placement readers tied to its clock. An optional played cue reuses the Engine event with its entry, actor, source time and output time, while descriptive labels remain independent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The owner supplies the played event list once beside the scene. Shared host descriptions copy it so Capture and Viewer use the same exact cue and can keep descriptive stock labels independently.

# src/draw/IAutoMovieRenderDrawScene.ts#IAutoMovieRenderDrawScene.playedCues

## @evidence contracts/development/common.md#meaningful-documentation

Declares actual occurrences from the subject's played sequence independently of descriptive labels.

# src/draw/IAutoMovieRenderDrawScene.ts#IAutoMovieRenderDrawScene.inspectMotionTrail

## @evidence contracts/development/common.md#meaningful-documentation

The optional source is called only after a requested trail seek settles. Neither a normal playback frame nor an empty trail request consults it.

# src/draw/IAutoMovieRenderDrawScene.ts#IAutoMovieRenderDrawScene.trailDiscontinuities

## @evidence contracts/development/common.md#meaningful-documentation

Declared breaks use the subject's shot-local times under its actual sequence and timeline. A selected trail separates samples across a declared break.
