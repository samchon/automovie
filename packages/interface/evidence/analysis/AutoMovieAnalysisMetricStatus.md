# src/analysis/AutoMovieAnalysisMetricStatus.ts#AutoMovieAnalysisMetricStatus

## @evidence contracts/development/design.md#principled-representation

Five closed literals split into valued and value-less families; `validateAutoMovieAnalysisRun` recomputes `meets` or `misses` from value, target and comparison and refuses a status from the wrong family for the value present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One status field replaces separate measured and passed flags; the surrounding metric remains a flat nullable record, so validation rather than this union rejects combinations such as a missed metric without a value.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A target dropped for a unit mismatch yields `untargeted` plus a warning rather than a fabricated `meets`, and a value-less metric can never take a passing status.

## @evidence contracts/development/common.md#meaningful-documentation

Gives which statuses carry a number, what `untargeted` means, where a missing value's reason lives, and the field agreement validation enforces.
