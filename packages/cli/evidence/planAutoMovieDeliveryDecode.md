# src/planAutoMovieDeliveryDecode.ts#planAutoMovieDeliveryDecode

## @evidence contracts/development/common.md#meaningful-documentation

Defines the indexed stream, native detector behavior, the optional input options and stderr evidence.

## @evidence contracts/development/implementation.md#principled-implementation

Maintains input timestamps with copyts, measures decoded pictures before output sync, and observes decoded duration independently of the commissioned clock. The delivered file and the encoder's input go through one identical filter chain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one filter chain followed by a null output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supplies the input file as a separate argument and asks FFmpeg to fail on decoding errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one decode for both video detectors. Disables extra per-frame checksums and pixel statistics.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure plan of one decode; its few arguments cost less than any cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh argument list and keeps nothing.
