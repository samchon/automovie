# src/picture/crcAutoMoviePngChunk.ts#crcAutoMoviePngChunk

## @evidence contracts/development/common.md#meaningful-documentation

Names the polynomial, its initial and final values, the bytes it covers and its two consumers.

## @evidence contracts/development/implementation.md#principled-implementation

The table-driven CRC of the PNG specification's sample code, with every step normalised to an unsigned 32-bit integer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the table once, then one loop over the bytes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The polynomial and the initial and final values are the specification's constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

One table lookup per byte; the 256-entry table is built once per process.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The table is shared by every chunk and call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the 1 KiB table for the life of the process; the bytes are read, not kept.
