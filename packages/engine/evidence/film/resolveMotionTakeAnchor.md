# src/film/resolveMotionTakeAnchor.ts#resolveMotionTakeAnchor

## @evidence contracts/development/common.md#meaningful-documentation

Defines the paired clocks, valid sides and end bounds, selection in a dissolve and the retained source endpoint at a cut.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same last-start selection and local affine clock as playback, tests hard cuts at their admitted start and reads an exact symbolic endpoint directly when a before anchor would otherwise reconstruct it through the rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Receives one prepared layout and shot index; source selection and seam checks stay in film while actual source replay is independent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Leaves exact before and after anchors distinct; inside an overlap the display's preferred incoming sample does not choose the saved source.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two O(log E) lookups, then constant-time checks of the neighboring entry and existing shot index for E entries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses playback's shared lookup and affine sample constructor; the caller shares the layout with repeated samples or verification.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns scalars and retains none of the borrowed layout and cut.
