# src/render/IAutoMovieCapturePlan.ts#IAutoMovieCapturePlan

## @evidence contracts/development/common.md#meaningful-documentation

Describes time windows, individual cells and the selected played occurrence.

## @evidence contracts/development/design.md#principled-representation

The plan retains the resolved event alongside the exact pose and native frame times. Each cell still has the selected view, pass and its own address.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planned event is exposed once for all the subject's associated cells. The cells continue to identify view, selection, pass and native frame or exact pose.

# src/render/IAutoMovieCapturePlan.ts#IAutoMovieCapturePlan.playedCue

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the resolved source cue and both clocks with the planned native and pose cells.
