# src/capture/resolveAutoMovieCapturePatterns.ts#resolveAutoMovieCapturePatterns

## @evidence contracts/development/common.md#meaningful-documentation

States which patterns are resolved and in what order, what the paths are, the matching rule and what is listed.

## @evidence contracts/development/implementation.md#principled-implementation `matchAutoMovieInspectionPath` is the rule the inspection selects, hides, labels, colours and focuses by, so a resolution reports what the picture drew; a pattern takes a matched path's subtree, so listing the topmost matches names every subtree without repeating its contents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Gather the patterns by role, then one match and one ancestor filter per pattern.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pattern that matches nothing is listed with no path rather than left out, so the record shows it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Patterns times paths matches, plus one set lookup per ancestor of each matched path.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one cell's request, view and paths.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns names and counts only, bounded by the patterns times the distinct subtrees they reach.
