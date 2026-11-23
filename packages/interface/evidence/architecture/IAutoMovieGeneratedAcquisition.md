# src/architecture/IAutoMovieGeneratedAcquisition.ts#IAutoMovieGeneratedAcquisition

## @evidence contracts/development/design.md#principled-representation `validateGeneratedAcquisition` requires a non-blank provider and model, a null or non-blank request and prompt, lowercase `sha256:` digests, non-blank input paths, an output digest equal to the current bytes when given, and a safe-integer seed, then ties the seed to `reproducible`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record holds only facts a generator returns or a caller sends, with the prompt text optional beside its always-present digest, so a private prompt is still identified without being published.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No URL or seed is invented for sampled output; production asset admission validates generation metadata and the published prompt hash, comparing generator output with current bytes only when no processing changed those bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Defines recorded generator identity, nullable prompt and request, reference order, safe-integer seed consistency without replay proof, UTF-8 prompt hashing and the processed-byte identity limitation.
