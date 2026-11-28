# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile

## @evidence contracts/development/common.md#meaningful-documentation

The entry describes how the host resolves and authenticates a source, and which provenance and calibration belong to its decoded chart.

## @evidence contracts/development/design.md#principled-representation

The caller names immutable encoded bytes by SHA-256 and provides calibration for that exact file chart. The loader assembles the corresponding resident RGB8 view.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The host owns path resolution, hash verification and decoding. The caller supplies identity, correction history and calibration.

# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile.id

## @evidence contracts/development/common.md#meaningful-documentation

The host transfers the ID to the resident input, where admission verifies uniqueness.

# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile.path

## @evidence contracts/development/common.md#meaningful-documentation

The command resolves the file from its manifest path and reads it under the request's byte ceiling.

# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile.sha256

## @evidence contracts/development/common.md#meaningful-documentation

The decoder sees an image only after its encoded bytes match this hash.

# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile.pixelProvenance

## @evidence contracts/development/common.md#meaningful-documentation

The loader checks the declared string and records its P6 decoding without altering the chart.

# src/recovery/IAutoMovieRecoveryCameraFile.ts#IAutoMovieRecoveryCameraFile.camera

## @evidence contracts/development/common.md#meaningful-documentation

The loader passes the supplied chart into resident validation and calibration use.
