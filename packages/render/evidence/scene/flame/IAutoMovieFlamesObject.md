# src/scene/flame/IAutoMovieFlamesObject.ts#IAutoMovieFlamesObject

## @evidence contracts/development/common.md#meaningful-documentation

States the meshes' names and parents, by which a host finds them, the applier's exact-time evaluation, visibility and bound lights, and disposal.

## @evidence contracts/development/design.md#principled-representation

One handle per prepared shot: a per-frame applier of shot-local seconds and an idempotent release; the meshes stay in the scene under their mask names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hosts call apply before each frame and dispose when the shot is retired; nothing else is exposed, and a reader finds a mesh by its name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mutable cue data is exposed.

# src/scene/flame/IAutoMovieFlamesObject.ts#IAutoMovieFlamesObject.apply

## @evidence contracts/development/common.md#meaningful-documentation

States what one call shapes, shows and hides, what it writes onto a bound flame's light, that the shape is taken at the exact time, and the refusal of a non-finite time.

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

# src/scene/flame/IAutoMovieFlamesObject.ts#IAutoMovieFlamesObject.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what the call detaches and releases and that a second call does nothing.

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
