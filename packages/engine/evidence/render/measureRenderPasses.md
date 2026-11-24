# src/render/measureRenderPasses.ts#measureRenderPasses

## @evidence contracts/development/common.md#meaningful-documentation

States when the phase runs, each pass it adds and how it is attributed, the feeds' targets and passes, and that the addition order is kept.

## @evidence contracts/development/implementation.md#principled-implementation

Each shadow depth face repeats the opaque geometry and each VSM filter draw is one fullscreen triangle; the outline pass is the peak only without a caster; a shown feed redraws the scene with its shadow maps; the background is one two-triangle draw. These are whole-frame passes over geometry counted before, so they are `pass` rows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory's frame-pass phase, split from the orchestrator by responsibility; feed sizing stays with `measureAutoMovieRenderFeeds`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No camera fact lowers a pass: every caster, the outline peak and every feed shown at once is counted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in lights, casters and feed tracks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each inventory runs it once over that subject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends rows to the caller's sink and returns fresh counts; it retains nothing.
