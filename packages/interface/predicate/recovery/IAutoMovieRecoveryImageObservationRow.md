# src/recovery/IAutoMovieRecoveryImageObservationRow.ts#IAutoMovieRecoveryImageObservationRow

## @evidence contracts/development/common.md#meaningful-documentation

The row distinguishes its center station from its two cell edges and assigns physical millimetres to all three fields. Lower edge precedes upper edge along image U.

## @evidence contracts/development/design.md#principled-representation

Recovery takes the first and last contiguous occupied pixels. Its lower edge uses the first column, its upper edge uses one past the last column, and its Y uses the half-row center. Those indices are reconstructible in the supplied chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three scalars describe one measured support. Row occupancy order and camera provenance belong to the containing view, while later fitting decides any interpolated stations.

# src/recovery/IAutoMovieRecoveryImageObservationRow.ts#IAutoMovieRecoveryImageObservationRow.yMm

## @evidence contracts/development/common.md#meaningful-documentation

The value uses the half-row center and gives the physical station used by the common-row fit.

# src/recovery/IAutoMovieRecoveryImageObservationRow.ts#IAutoMovieRecoveryImageObservationRow.lowerMm

## @evidence contracts/development/common.md#meaningful-documentation

From the first foreground column, Recovery subtracts u0 and multiplies by the supplied pitch.

# src/recovery/IAutoMovieRecoveryImageObservationRow.ts#IAutoMovieRecoveryImageObservationRow.upperMm

## @evidence contracts/development/common.md#meaningful-documentation

Recovery uses one past the last occupied column to enclose that complete pixel cell. Chart admission requires a positive interval.
