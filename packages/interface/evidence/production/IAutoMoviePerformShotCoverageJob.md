# src/production/IAutoMoviePerformShotCoverageJob.ts#IAutoMoviePerformShotCoverageJob

## @evidence contracts/development/design.md#principled-representation

Pairs the intent with the resolved staged camera, because the take compiles from that camera's own staged bearing and the gate has already proven the lookup succeeds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, the intent and its camera, which is all the framing-camera gate and the coverage compile read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Recorded only after every coverage rule passed, so the compile never meets a duplicate, hero or unstaged camera.

## @evidence contracts/development/common.md#meaningful-documentation

States when one is recorded, who consumes it and in what order, and what each field holds.
