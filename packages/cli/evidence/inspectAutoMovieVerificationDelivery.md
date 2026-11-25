# src/inspectAutoMovieVerificationDelivery.ts#inspectAutoMovieVerificationDelivery

## @evidence contracts/development/common.md#meaningful-documentation

Explains how the audited staging digest binds the promoted movie and the required control record. A blocked or failed attempt exposes the former movie.

## @evidence contracts/development/implementation.md#principled-implementation

The published report names the promoted movie and retains the staged source and its audit digest. The current movie digest binds the report and the control record. The record matches the report's frame count and rational rate. Each required channel lists the exact authored index and second written by the draw loop to both outputs, plus one digest per frame and a matching sequence checksum. Use the frame digests when transferring the control PNG files.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reader establishes report, movie bytes and required control record in that order. A malformed report or control record points to the file that needs repair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A former render beside a blocked or failed report cannot clear delivery. Matching movie and sequence digests do not substitute for the frame addresses in the report. The authored times come from the draw loop that writes both records.

## @evidence contracts/development/implementation.md#efficient-algorithms

One report read, one movie digest lookup and at most one control record read. For required controls, examine the report's drawn frames once. Compare addresses and hash listed ASCII digests in one pass per required channel. A failed attempt checks at most two former paths.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The injected evaluator reader shares a movie digest for an unchanged file during one verification run. The render report and required control record are read for each check.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Parsed records remain local to the call. Each channel's digest is computed from its rows in order without building a second sequence buffer. The shared digest reader releases the movie stream.
