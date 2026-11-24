# src/scene/flame/IPrepareAutoMovieFlamesProps.ts#IPrepareAutoMovieFlamesProps

## @evidence contracts/development/common.md#meaningful-documentation

States what each field supplies, why the light clips are read, and that bound flames resolve their built lights once at preparation.

## @evidence contracts/development/design.md#principled-representation

The admitted shot's cues, light clips and duration, the staged scene's node models and lights, the models and the host's node and light resolvers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by prepareAutoMovieFlames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shot and scene are narrowed to the fields read.

# src/scene/flame/IPrepareAutoMovieFlamesProps.ts#IPrepareAutoMovieFlamesProps.resolveNode

## @evidence contracts/development/common.md#meaningful-documentation

States what the resolver returns for a scene node and that the flame is parented to its object.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.

# src/scene/flame/IPrepareAutoMovieFlamesProps.ts#IPrepareAutoMovieFlamesProps.resolveLight

## @evidence contracts/development/common.md#meaningful-documentation

States what the resolver returns for a staged light id, that each apply writes a bound flame's light clip onto it, when it is called and that a missing light is refused.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.
