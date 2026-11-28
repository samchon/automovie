# src/recovery/IAutoMovieRecoveryImageFiles.ts#IAutoMovieRecoveryImageFiles

## @evidence contracts/development/common.md#meaningful-documentation

The manifest states a supported byte interpretation, borrowed capture metadata, explicit file order and a per-image header cap. The scaffold host checks the listed view count and passes both input populations and decoding caps to their owners.

## @evidence contracts/development/design.md#principled-representation

The host resolves only the supplied view paths and reads each with a byte cap. It verifies original bytes, decodes under the remaining aggregate pixel budget and passes the same charts and capture policy to resident observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The manifest owns the file list and the declared header limit. Each file entry owns its chart identity and digest. The resident capture type supplies its separate shared object, frame, background and population policy.

# src/recovery/IAutoMovieRecoveryImageFiles.ts#IAutoMovieRecoveryImageFiles.encoding

## @evidence contracts/development/common.md#meaningful-documentation

The host accepts the ppm-srgb-rgb8 tag and passes the exact transfer convention to the decoder.

# src/recovery/IAutoMovieRecoveryImageFiles.ts#IAutoMovieRecoveryImageFiles.capture

## @evidence contracts/development/common.md#meaningful-documentation

The host builds the resident views from the files, then supplies this capture policy to observation.

# src/recovery/IAutoMovieRecoveryImageFiles.ts#IAutoMovieRecoveryImageFiles.maxHeaderBytes

## @evidence contracts/development/common.md#meaningful-documentation

The decoder checks its cursor against this cap and refuses a truncated header or one that reaches beyond the supplied scan limit.

# src/recovery/IAutoMovieRecoveryImageFiles.ts#IAutoMovieRecoveryImageFiles.views

## @evidence contracts/development/common.md#meaningful-documentation

The host iterates the listed entries only and preserves their order in the resident capture. The declared view cap also applies before decoding.
