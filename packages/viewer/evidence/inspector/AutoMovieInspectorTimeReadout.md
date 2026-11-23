# src/inspector/AutoMovieInspectorTimeReadout.tsx#AutoMovieInspectorTimeReadout

## @evidence contracts/development/common.md#meaningful-documentation

States what it shows, why it alone reads the playhead's second, when it edits the request and what it announces.

## @evidence contracts/development/implementation.md#principled-implementation `useSyncExternalStore` reads the cached playhead snapshot without tearing. Native range inputs enforce their step grid, so integer positions give every frame and the exact end a valid slider value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One store read, one slider that converts its position to seconds on seek, and one clock output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Playback frames dispatch nothing; only a seek and the change from playing to stopped edit the request, and the first render, which stops nothing, edits nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per render, one render per moved snapshot.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared presentation grid and computes its last frame number once per render.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

React holds one playhead subscription while the readout is mounted and removes it on unmount.
