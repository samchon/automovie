# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles

## @evidence contracts/development/common.md#meaningful-documentation

The manifest states the accepted resident metadata, codec, ordered captures and per-image header limit.

## @evidence contracts/development/design.md#principled-representation

The acquisition host resolves file paths, verifies encoded source hashes and decodes in the declared pixel charts. It builds the resident input from the resulting RGB8 arrays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Node owner acquires fixed bytes and writes the completed artifact. Resident Recovery owns camera admission and geometry. File paths and raster bytes stay outside the resulting sparse evidence.

# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles.schema

## @evidence contracts/development/common.md#meaningful-documentation

The CLI checks the exact tag and required manifest keys before acquiring image bytes.

# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles.encoding

## @evidence contracts/development/common.md#meaningful-documentation

The host calls the fixed sRGB P6 decoder and preserves the supplied camera chart.

# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles.capture

## @evidence contracts/development/common.md#meaningful-documentation

The capture record supplies all resident inputs other than the image views.

# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles.maxHeaderBytes

## @evidence contracts/development/common.md#meaningful-documentation

The host gives each decoder the same header cap and a decreasing aggregate pixel allowance.

# src/recovery/IAutoMovieRecoveryCameraSceneFiles.ts#IAutoMovieRecoveryCameraSceneFiles.views

## @evidence contracts/development/common.md#meaningful-documentation

Each image is acquired and hashed once in declared order; that same order determines seed indices and returned source metadata.
