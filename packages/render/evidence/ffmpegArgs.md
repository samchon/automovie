# src/ffmpegArgs.ts#ffmpegArgs

## @evidence contracts/development/implementation.md#principled-implementation

The arguments are documented ffmpeg options passed in one fixed order, with `-framerate` setting the image-sequence input clock and `-r` the output clock so no frame is dropped or duplicated, and `-s` scaling to the spec raster; the unresolved limitations are the unspecified RGB-to-YUV conversion and missing colour tags, and the decimal rate, both stated in the doc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single render, the sequence plan and the chunk plan all encode through this one vector, and the caller supplies only the input pattern and output path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every spec value is passed verbatim, the CRF unchecked as the spec documents, and no host or spec is special-cased; the missing colour flags are the gap the doc names, not a compensation.

## @evidence contracts/development/common.md#meaningful-documentation

The doc spells the exact vector, why the raster is pinned, the unchecked even-raster requirement, who owns tone mapping, and the colour and rate limitations.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Building a fixed argument array chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each encode builds its vector once, cheaper than caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns an array of strings and starts no process; the caller owns the ffmpeg process it may start.
