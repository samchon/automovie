# src/createAutoMovieVerificationMediaHash.ts#createAutoMovieVerificationMediaHash

## @evidence contracts/development/common.md#meaningful-documentation

Defines command-local digest reuse and the outcome of a file change during hashing.

## @evidence contracts/development/implementation.md#principled-implementation

Device, inode, size and the high-resolution modification and change clocks identify the file snapshot. A digest is published after streaming and a second matching stat.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared reader owns cached snapshot hashes for capture, delivery and review verification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A path alone cannot reuse a digest. A read across different snapshots fails and does not populate the cache.

## @evidence contracts/development/implementation.md#efficient-algorithms

An unchanged media file is streamed once and repeated checks perform a stat and map lookup. The reader never buffers an entire file.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All checks in the evaluation share the same latest snapshot for each path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each encountered path keeps one fingerprint and digest until the evaluation returns. The digest helper owns and releases its stream.
