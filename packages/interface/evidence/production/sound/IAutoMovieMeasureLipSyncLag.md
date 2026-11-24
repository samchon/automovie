# src/production/sound/IAutoMovieMeasureLipSyncLag.ts#IAutoMovieMeasureLipSyncLag

## @evidence contracts/development/common.md#meaningful-documentation

Names the measurement's inputs and result.

## @evidence contracts/development/design.md#principled-representation

A namespace of the measurement's contract.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract engine's `measureAutoMovieLipSyncLag` exposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is declared on the namespace itself.

# src/production/sound/IAutoMovieMeasureLipSyncLag.ts#IAutoMovieMeasureLipSyncLag.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the window, each series' unit and the refusals.

## @evidence contracts/development/design.md#principled-representation

Two per-frame series over one window and the rate that turns frames into milliseconds; equal length and finiteness are runtime refusals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by render's lip-sync route and read by the measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The series are plain numbers, so any representation's mouth value fits.

# src/production/sound/IAutoMovieMeasureLipSyncLag.ts#IAutoMovieMeasureLipSyncLag.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the lag's sign convention, the thresholds and their source, and what an inconclusive result reports.

## @evidence contracts/development/design.md#principled-representation

The lag in frames and milliseconds, the correlation in [−1, 1] and a closed verdict.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the measurement and carried into the render report's lip-sync entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An inconclusive result keeps the fields defined rather than absent, so the report stays one shape.
