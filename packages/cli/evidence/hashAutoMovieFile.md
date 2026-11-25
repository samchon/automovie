# src/hashAutoMovieFile.ts#hashAutoMovieFile

## @evidence contracts/development/common.md#meaningful-documentation

States the byte input, lowercase SHA-256 output and failed-read behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The streaming SHA-256 uses every byte of the opened file, allowing consumers to compare the identity of complete publication contents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns only the read and digest. Callers decide where that digest belongs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed or incomplete stream rejects. The function does not substitute a filename, modification time or claimed digest for the file bytes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the file once. Time grows with file bytes and retention is the stream's buffer and hash state.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Inputs can change at a stable path, so each invocation hashes the current bytes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Node's read stream owns the descriptor and closes it at EOF or error. No copy or handle remains in this function after it settles.
