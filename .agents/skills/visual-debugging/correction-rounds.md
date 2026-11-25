# Correction rounds

## Measuring and looking

Measure positions, depths, timings and other quantities under the subject skill, then [plan the capture](capture.md#plan).

## Inspection

Before editing, inspect the affected subject at all needed scales, views and times, including adjacent parts. Record each defect, cell and conditions.

## Causes

Trace causes through generation, display, shared boundaries and derived outputs. Run all necessary controlled [comparisons](comparison.md) on one unchanged source. Record results and map each fix to affected defects and parts.

## One combined change

Fix all causes at their owners in one change. Judge the assembled subject. Coordinate fixes across owners or report ownership blocks.

## Comparing again

Repeat the round and check defects and regressions across parts, views, times, identities, resolutions and states. Account for all findings. Keep the round open while any new or unexplained defect remains.

When a fix is tried over several rounds, keep a round only if nothing got worse than in the best earlier round, and record every remaining failure with its numbers.

The inspection findings a capture records are the defects its checks report on the drawn stills. Capture the round with `compare` set to the best earlier round, and read whether they got worse from the comparison's finding outcome, as `IAutoMovieCaptureFindingDiff` defines it. A `worse` outcome rejects the round. An `unmatched` error keeps the round from counting as better. Recheck the missing finding intervals in the round that lacks coverage. Judge defects that only the stills show by eye under [comparison](comparison.md).

Open the current capture before accepting it.

In a production with `pnpm run verify`, select the affected target and read its current results. Reuse a useful check or add one beside the affected asset, motion case or shot. In its source comment, state what should happen, where and what observation decides it. Run a reproducible defect check on the old and rebuilt work over the same bounds. Keep recurring checks with their owner and remove one-off definitions when the round ends.

Require an agreed stage at its handoff. Carry the selected scoped observations and the director's decision to the existing review record.
