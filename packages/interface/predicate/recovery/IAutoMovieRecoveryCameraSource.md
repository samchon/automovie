# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource

## @evidence contracts/development/common.md#meaningful-documentation

The record keeps the source hash, provenance, original chart size and caller-supplied calibration after image acquisition.

## @evidence contracts/development/design.md#principled-representation

The metadata pairs one captured raster identity with the corrected pinhole chart in which its features were measured. The result retains source order independently of registration status.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The file host verifies source bytes and the resident caller asserts provenance. Evidence copies metadata and does not carry acquired RGB storage.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.id

## @evidence contracts/development/common.md#meaningful-documentation

Pair, map and scene evidence copy the source ID from the admitted view.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.sourceSha256

## @evidence contracts/development/common.md#meaningful-documentation

The file-backed reader checks this digest against encoded bytes before decoding. The resident result copies the supplied digest.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.pixelProvenance

## @evidence contracts/development/common.md#meaningful-documentation

The file host records its concrete P6 decoding and unchanged chart. The result preserves the admitted provenance string.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.width

## @evidence contracts/development/common.md#meaningful-documentation

The width belongs to the original image, so pixel observations remain interpretable after descriptor pyramid work.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.height

## @evidence contracts/development/common.md#meaningful-documentation

The height is copied with the width so consumers can place observations in the exact resident chart.

# src/recovery/IAutoMovieRecoveryCameraSource.ts#IAutoMovieRecoveryCameraSource.camera

## @evidence contracts/development/common.md#meaningful-documentation

Result assembly copies the calibration vectors so later changes to caller metadata do not alter evidence.
