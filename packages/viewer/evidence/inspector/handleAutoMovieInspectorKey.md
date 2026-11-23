# src/inspector/handleAutoMovieInspectorKey.ts#handleAutoMovieInspectorKey

## @evidence contracts/development/common.md#meaningful-documentation

States every key, when a key is left to the page and why, what each returns and why play and pause return no second.

## @evidence contracts/development/implementation.md#principled-implementation

Every move goes through the playhead's own `play`, `pause` and `seek`; a frame step advances the slider's displayed index; the interactive target is found with the platform's `Element.closest` over one selector list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two early returns, then one table from key to move and one lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The playhead clamps every seek to the film, so nothing here restates its bounds; a key is never taken from a control that answers it, so no control loses its own keyboard behaviour.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per key, besides one `closest` walk up the target's ancestors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same presentation grid as the slider.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing between calls.
