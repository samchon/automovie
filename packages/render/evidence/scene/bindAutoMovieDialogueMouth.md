# src/scene/bindAutoMovieDialogueMouth.ts#bindAutoMovieDialogueMouth

## @evidence contracts/development/common.md#meaningful-documentation

States what binding does, where the page looks for bound objects and when, which representations bind themselves, and that a later binding replaces an earlier one.

## @evidence contracts/development/implementation.md#principled-implementation

A figure is found by the object its representation owns, the same object a production places under the actor's node, so the binding needs no actor id and survives the node being renamed or reparented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One weak-map write; the map is the render module `AutoMovieDialogueMouthFigures` the page reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No figure kind is assumed; the figure says what it shows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single write that shares nothing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The entry is weak, keyed by the object, so it is released with the figure's object.
