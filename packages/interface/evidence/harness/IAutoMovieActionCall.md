# src/harness/IAutoMovieActionCall.ts#IAutoMovieActionCall

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `verb` lets `performShot` validate each verb's own fields by narrowing and lets `compilePerformance` hand body verbs to the injected synthesizer while `attachTo`, `launch` and `frame` go to `compileAttach`, `compileLaunch` and `compileCameraMove`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eleven verbs share `IAutoMovieActionBase` and add only what their motion needs, so the authored record stays thin and every dense detail is the engine's to compute.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null synthesis is skipped rather than substituted; admitted action presence alone therefore does not prove an actor performed it. Enact uses the same mask/composite ROM path at performShot, while direct compilePerformance alone owns assembly rather than shot admission. Layered motion uses sampled union/boundary times and can interpolate short transitions instead of preserving every source curve continuously.

## @evidence contracts/development/common.md#meaningful-documentation

States the model-versus-engine division, the discriminator, how actions compose into one clip, that the camera is an actor, which verbs the reference synthesizer animates, which have their own passes, and what happens to an unanswered verb.
