# Correction rounds

## Measuring and looking

Measure positions, depths, timings and other quantities under the subject skill, then [plan the capture](capture.md#plan).

## Inspection

Before editing, inspect the subject and adjacent parts at all required scales, views and times. Record each defect, cell and conditions.

## Causes

Trace causes through generation, display, shared boundaries and derived outputs. Run all necessary controlled [comparisons](comparison.md) on one unchanged source. Record results and map each fix to affected defects and parts.

## One combined change

Fix all causes at their owners in one change. Judge the assembled subject. Coordinate fixes across owners or report ownership blocks.

## Comparing again

Repeat the round for all parts, views, times, identities, resolutions and states. Account for findings and regressions. Keep the round open while new or unexplained defects remain.

When a fix is tried over several rounds, keep a round only if nothing got worse than in the best earlier round, and record every remaining failure with its numbers.

The inspection findings a capture records are the defects its checks report on the drawn stills. Capture the round with `compare` set to the best earlier round, and read whether they got worse from the comparison's finding outcome, as `IAutoMovieCaptureFindingDiff` defines it. A `worse` outcome rejects the round. An `unmatched` error keeps the round from counting as better. Recheck the missing finding intervals in the round that lacks coverage. Judge defects that only the stills show by eye under [comparison](comparison.md).

Open the current capture before accepting it.

Use `pnpm run check` on the affected target when configured. Compare before and after over the same bounds. Add a regression check at its owner if needed. Require a stage at its handoff.
