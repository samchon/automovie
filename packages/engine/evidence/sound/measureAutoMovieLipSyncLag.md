# src/sound/measureAutoMovieLipSyncLag.ts#measureAutoMovieLipSyncLag

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the standardization, the lag range and its source, the correlation, the tie rule and the three verdicts.

## @evidence contracts/development/implementation.md#principled-implementation

Normalized cross-correlation over integer frame lags: standardizing both series removes level and scale, so the peak lag aligns their shapes. The verdict thresholds are ITU-R BT.1359-1's detectability limits, and a constant series or a weak peak carries no lag to judge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The route builds the series from the values it hands to the drawing; this function only measures, so it serves any representation's series.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The thresholds and window are named in `AUTOMOVIE_LIP_SYNC` with their origins; the minimum correlation is a stated default. Non-finite input is refused, not skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N × W) for N window frames and W lags, small for a line.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its series.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It allocates two standardized copies and holds no resource.
