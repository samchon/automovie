# src/recovery/image/IAutoMovieRecoveryCameraFiles.ts#IAutoMovieRecoveryCameraFiles

## @evidence contracts/development/design.md#principled-representation

Explicit file hashes bind fixed RGB8 sources to independently supplied intrinsics before automatic image observation. A declared sRGB P6 variant avoids guessing a standard PPM transfer function or a camera calibration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resident input's camera policy and metadata are reused while the Node owner alone acquires paths, verifies complete bytes and decodes bounded rasters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No directory discovery, implicit image transform, inferred lens, manual correspondence, source mesh or unverified capture history supplies a camera.

## @evidence contracts/development/common.md#meaningful-documentation

States relative paths, fixed-byte hashes, sRGB assertion, decode/header bounds, prior derivation provenance and unchanged pixel charts.
