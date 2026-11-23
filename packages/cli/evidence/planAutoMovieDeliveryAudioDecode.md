# src/planAutoMovieDeliveryAudioDecode.ts#planAutoMovieDeliveryAudioDecode

## @evidence contracts/development/common.md#meaningful-documentation

States which stream is decoded, the precise PCM format and both output channels.

## @evidence contracts/development/implementation.md#principled-implementation

Logs the audio frames after converting sample format and before writing PCM. Does not request a different sample rate or channel layout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects one stream, logs its sample frames and writes an unpadded PCM output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Passes the file path directly and preserves decoded timestamps with copyts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one streaming decode, only for an artifact with an audio stream.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each decode builds its own argument array once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array and holds nothing.
