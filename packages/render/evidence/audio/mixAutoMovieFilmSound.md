# src/audio/mixAutoMovieFilmSound.ts#mixAutoMovieFilmSound

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which files are read and through what, which package admits and decodes them, how the plan places lines and cues and carries room-tone beds, which mixer runs, how lines are levelled and the master meets the loudness targets, the WAVE output and determinism, and every refusal with when it happens.

## @evidence contracts/development/implementation.md#principled-implementation

Each line's span is the shared speech-span rule over its admitted 48 kHz sample count, so the plan, the ducking and the placement agree with the bytes. The plan's identity is the canonical digest of the list, the line PCM digests and the cue asset digests, so equal inputs give an equal plan, and cue seeds derive from it. The master is the engine mixer's output encoded at 16 bits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Render owns only the route: reading through the host, building the plan and encoding. Admission and decoding stay in ingest, mixing and the span rule in engine, so the delivered soundtrack comes from the film's one mixer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A file the host cannot read is refused by path rather than replaced by a stand-in, and duplicate ids are refused because the report, ducking and viseme join key on them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bytes read and the film's samples: each distinct cue asset is read, digested and decoded once, each line once, and the master is split and encoded in one pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cues naming the same asset path share one read and decode, keyed by the path within one call; nothing is retained across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Decoded lines and assets live for the call; the WAVE bytes, plan, analysis and admitted lines transfer to the caller. No file handle is opened by render.
