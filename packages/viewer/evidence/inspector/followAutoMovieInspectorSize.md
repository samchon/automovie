# src/inspector/followAutoMovieInspectorSize.ts#followAutoMovieInspectorSize

## @evidence contracts/development/common.md#meaningful-documentation

States when it resizes, what it leaves to the page and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Resizes the drawing buffer only for a drawable size that changed, as the frame loop needs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One drawability test and one change test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An undrawable size is reported, not drawn at.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Compares with the size the mount holds, so an unchanged size costs nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the mount's size and dirty flag.