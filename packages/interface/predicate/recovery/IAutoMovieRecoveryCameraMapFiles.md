# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles

## @evidence contracts/development/common.md#meaningful-documentation

The acquisition contract identifies exact manifest and codec tags, three ordered files, per-image header limits, and the source of the resident metadata.

## @evidence contracts/development/design.md#principled-representation

The file host prepares borrowed resident RGB8 views by combining checked byte identity with unchanged decoded coordinates and supplied corrected pinhole charts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Paths, input byte and header limits, hash checking and artifact publication belong to the Node host. Resident estimation owns the map policy and observation result.

# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles.schema

## @evidence contracts/development/common.md#meaningful-documentation

The command checks the literal and the complete manifest key set before opening view files.

# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles.encoding

## @evidence contracts/development/common.md#meaningful-documentation

The host dispatches the fixed P6 sRGB decoder and supplies caller-corrected charts to resident recovery.

# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles.capture

## @evidence contracts/development/common.md#meaningful-documentation

The loader reads all resident fields except the RGB-bearing views and constructs those from the checked file entries.

# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles.maxHeaderBytes

## @evidence contracts/development/common.md#meaningful-documentation

Each file decode receives this same bound, alongside the remaining aggregate pixel allowance.

# src/recovery/IAutoMovieRecoveryCameraMapFiles.ts#IAutoMovieRecoveryCameraMapFiles.views

## @evidence contracts/development/common.md#meaningful-documentation

Each file is checked against its SHA-256 and admitted in the given order, preserving the first two source identities as the seed.
