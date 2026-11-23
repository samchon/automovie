# src/ffmpegArgs.ts#ffmpegArgs

## @evidence contracts/development/implementation.md#principled-implementation

The arguments are documented ffmpeg options passed in one fixed order, with `-framerate` setting the image-sequence input clock and `-r` the output clock so no frame is dropped or duplicated, and one `scale` filter both sizing to the spec raster and converting RGB to YUV with the BT.709 matrix at full range, so the H.273 tags it then writes (primaries 1, transfer 13, matrix 1, full range) describe the samples; `-bf 0` keeps composition order equal to decode order from time zero, as the delivery profile requires; measured with FFmpeg 6.1.1 libx264 at CRF 18 and the medium preset on 241 frames of `testsrc2` at 320x240, it costs 2.4% in size (809,022 bytes against 789,970 with the default B-frames). The remaining limitation is the decimal rate, stated in the doc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single render, the sequence plan and the chunk plan all encode through this one vector, and the caller supplies only the input pattern and output path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every spec value is passed verbatim, the CRF unchecked as the spec documents, and no host or spec is special-cased; the colour conversion and tags are the delivery profile's fixed declaration, not a per-subject choice.

## @evidence contracts/development/common.md#meaningful-documentation

The doc spells the exact vector, why the raster is pinned, the unchecked even-raster requirement, who owns tone mapping, the colour conversion and tags, the B-frame setting and the rate limitation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Building a fixed argument array chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each encode builds its vector once, cheaper than caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns an array of strings and starts no process; the caller owns the ffmpeg process it may start.
