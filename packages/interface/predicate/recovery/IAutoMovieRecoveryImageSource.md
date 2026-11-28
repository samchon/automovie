# src/recovery/IAutoMovieRecoveryImageSource.ts#IAutoMovieRecoveryImageSource

## @evidence contracts/development/common.md#meaningful-documentation

Both fitting owners retain the capture ID and original encoded-byte hash from each admitted observation view.

## @evidence contracts/development/design.md#principled-representation

The capture ID and recorded SHA-256 retain the observation's source association after the image arrays have been discarded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The file-backed command verifies bytes before decoding and observation. The fitter carries the matching identity and hash without keeping the capture path, chart, or RGB array.

# src/recovery/IAutoMovieRecoveryImageSource.ts#IAutoMovieRecoveryImageSource.id

## @evidence contracts/development/common.md#meaningful-documentation

Both fit owners copy the observation view ID, keeping the same key as acquisition.

# src/recovery/IAutoMovieRecoveryImageSource.ts#IAutoMovieRecoveryImageSource.sha256

## @evidence contracts/development/common.md#meaningful-documentation

The file command checks SHA-256 over encoded bytes before decoding; the fit carries the observation's recorded hash.
