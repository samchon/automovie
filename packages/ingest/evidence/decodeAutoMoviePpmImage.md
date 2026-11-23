# src/decodeAutoMoviePpmImage.ts#decodeAutoMoviePpmImage

## @evidence contracts/development/implementation.md#principled-implementation

The documented P6 header and exact RGB raster length determine decoding; explicit transfer metadata avoids relabeling standard BT.709 samples as sRGB. Pixel/header budgets are validated before the detached output allocation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This renderer-free byte codec performs only admission and RGB extraction; capture calibration, foreground observation and source publication remain with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No header repair, ignored trailing image, post-header whitespace skipping, unsupported maxval rescaling or implicit colour conversion changes fixed bytes.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted P6 subset, comments, delimiter/raster distinction, detached ownership, transfer declaration, unsupported variants and budget refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Parsing costs O(H) for admitted header bytes and one O(P) RGB copy for P pixels; maxHeaderBytes and maxPixels bound both populations before allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each synchronous call decodes caller-supplied fixed bytes once and defines no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one detached RGB8 result; borrowed source bytes and constant header scratch are released from the call without handles or global retention.
