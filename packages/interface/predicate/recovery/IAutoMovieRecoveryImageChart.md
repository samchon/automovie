# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart

## @evidence contracts/development/common.md#meaningful-documentation

The chart ties an original byte hash and producer-declared pixel history to the current raster dimensions, identity and calibrated coordinates.

## @evidence contracts/development/design.md#principled-representation

The same chart declaration serves both the resident input view and its measured observation view. The observer checks unique IDs, hash format, documented provenance and dimensions, then copies the admitted values with the resulting rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity, byte provenance and calibration travel through observation. Pixel storage and measured rows belong to the respective view records that extend this chart.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.id

## @evidence contracts/development/common.md#meaningful-documentation

Observation requires distinct view identities and preserves each identity in the same output order.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.sourceSha256

## @evidence contracts/development/common.md#meaningful-documentation

The scaffold host compares the digest of loaded bytes with the supplied manifest hash. Resident admission checks its hexadecimal shape.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.pixelProvenance

## @evidence contracts/development/common.md#meaningful-documentation

The P6 host supplies its actual top-to-bottom decode history. The observer copies the stated history into the view receipt.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.width

## @evidence contracts/development/common.md#meaningful-documentation

The observer checks width times height against its pixel cap and uses width to index each row.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.height

## @evidence contracts/development/common.md#meaningful-documentation

The observer checks raster area and scans these rows from top to bottom before reversing measured results into increasing Y.

# src/recovery/IAutoMovieRecoveryImageChart.ts#IAutoMovieRecoveryImageChart.camera

## @evidence contracts/development/common.md#meaningful-documentation

Chart admission checks the representable physical image bounds. Returned view receipts copy the admitted camera and principal-point values.
