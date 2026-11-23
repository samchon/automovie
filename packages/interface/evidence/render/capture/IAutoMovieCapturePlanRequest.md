# src/render/capture/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest

## @evidence contracts/development/design.md#principled-representation

Each member is one independent question the visual-debugging skill asks of a capture: subject, times, views, passes, selections, reader budget and round. Times are film seconds and frames of the subject's own grid, budget edges are pixels and the sweep margin is metres. Explicit seconds and an even sampling exclude each other, so they are a union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inspection is the inspection core's own request, composed rather than repeated, and view texts stay text checked by the inspection core's view grammar. Each member serves a skill requirement: times, events and the cut threshold capture.md's Times, views its Views, sweep and margin its Subject, passes passes.md, budget the reader budget, round, compare and tolerance comparison.md.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `passes` and the inspection's `shade` name one concept; the parser keeps them equal (`inspection.shade` is `passes[0]`) and refuses a request that gives both. That `to` exceeds `from`, a margin needs a sweep, and a tolerance a comparison are runtime checks of the parser.

## @evidence contracts/development/common.md#meaningful-documentation

States the reader and writer, what the subject check leaves to the planner, and each member's unit and absent meaning.
