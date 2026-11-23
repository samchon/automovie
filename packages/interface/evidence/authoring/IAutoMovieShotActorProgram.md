# src/authoring/IAutoMovieShotActorProgram.ts#IAutoMovieShotActorProgram

## @evidence contracts/development/design.md#principled-representation `compileDefinedShot` refuses an entry whose node is blank, repeated or absent from `stage.actors`, whose model id is blank, whose speed is not finite and positive, or whose eye height is not finite and non-negative; the production host then resolves `model` in its runtime registry, refuses a missing or rig-less model and a duplicate gait name, and builds the actor context from the stage placement plus these values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds only the scale-dependent values a generic builder would otherwise guess, keyed by node; geometry, skeleton and gait curves stay with the model, and position and facing stay with the stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default speed or eye height is supplied for a missing or invalid value; the host refuses the entry and names the field instead.

## @evidence contracts/development/common.md#meaningful-documentation

States what each value drives, its unit and bounds, which node the entry may name, and that resolving the model is the host's job with the refusals it applies.
