# src/recovery/IAutoMovieRecoveryImageObservationView.ts#IAutoMovieRecoveryImageObservationView

## @evidence contracts/development/common.md#meaningful-documentation

The view describes its original chart, row order and the scope of its quantization measurement. The existing orthographic fixture checks occupied count, Y order and physical cell limits.

## @evidence contracts/development/design.md#principled-representation

Recovery scans raster rows top to bottom, converts their half-row centers to Y and reverses the measured rows. The recorded half pitch measures ideal pixel quantization. Downstream support admission requires the same value and validates increasing physical Y independently of adjacency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The view extends the same chart as the capture and adds only owned measurements. The source raster and estimated support between views remain outside the view receipt.

# src/recovery/IAutoMovieRecoveryImageObservationView.ts#IAutoMovieRecoveryImageObservationView.rows

## @evidence contracts/development/common.md#meaningful-documentation

The observer reverses top-to-bottom raster measurements into physical order. Support fitting requires that order before checking adjacency.

# src/recovery/IAutoMovieRecoveryImageObservationView.ts#IAutoMovieRecoveryImageObservationView.quantizationMm

## @evidence contracts/development/common.md#meaningful-documentation

The observer computes pixelPitchMm / 2 and fitting checks exact equality. The value quantifies the grid alone.
