# src/renderAutoMovieVideo.ts#renderAutoMovieVideo

## @evidence contracts/development/common.md#meaningful-documentation

Documents the transparent layer's folder, file, missing audio, skipped black check and sample check, the control channels staged and published with the film and their record's binding to the film digest, the measured sources, the loudness targets the decoded audio must meet and where they come from, the lip-sync verdict that blocks, paths and refusal behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Uses Render for drawing and auditing, hashes and decodes exactly one uniquely staged candidate, measures the encoder's own inputs the same way so drawn and encode-introduced intervals are told apart, checks the encoded boxes against the picture and sound profiles through `auditAutoMovieDeliveryProfile`, and settles every verdict before replacing any delivered bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reserves the output through `AutoMovieRenderOutputReservation`, renders, audits, stages the report and the control record and publishes through `publishAutoMovieRenderAttempt`, then releases owned resources.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed attempts carry their own report status and digest when measured. Confirmed findings, unresolved required checks and profile findings prevent the candidate rename.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one encode, one streamed hash, one video decode and an audio decode only when present, plus one decode of the drawn frames and one of the soundtrack the encoder read, and one read of the candidate's box headers for the profile check. PNG scratch is never copied into the delivery folder.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each render draws, encodes and decodes afresh, because every attempt stages its own candidate bytes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the output reservation through both publication operations and releases the session and its unique staging folders on completion.
