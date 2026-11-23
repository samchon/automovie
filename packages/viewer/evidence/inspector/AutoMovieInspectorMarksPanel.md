# src/index.ts#AutoMovieInspectorMarksPanel

## @evidence contracts/development/common.md#meaningful-documentation

States what is listed, when a kind is checked, where typed patterns appear and what the legend counts.

## @evidence contracts/development/implementation.md#principled-implementation

Render's shared option list admits the declared and styled kinds. Its inspection handle supplies the current legend. A declaration without a style still has a checkbox.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One checkbox per kind, one switch, one list of legend entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A typed pattern that is not a listed kind is shown with its own checkbox rather than dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the supplied marks, the kinds, the patterns and the legend.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.
