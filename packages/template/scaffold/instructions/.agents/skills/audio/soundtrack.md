# Commissioned soundtrack

Record a commissioned soundtrack's tracks in the [delivery profile](../production/project-context.md#the-delivery-profile) with the [loudness](film-sound.md#loudness) target, acquire its material under [acquisition](acquisition.md) and build it under [sound effects](sound-effects.md). Have the user listen at every acceptance [listening](listening.md#user-listening) names.

A direct 3D film's dialogue belongs to its soundtrack, and [direct film](../video/direct-film.md#faces-and-speech) times the mouths to it.

Write a generated score's request under [music prompts](diffusion/prompts.md#music), then adopt its take under acquisition.

## Sound list

Declare a direct 3D film's adopted sound as its production's `sound` member (`IAutoMovieFilmSound`), and leave `delivery.audio.path` unset; `pnpm run render` refuses a film that declares both. The list holds:

- each spoken line's id, text, language, speaker, start frame, WAVE file and receipt;
- each cue placed on the film clock with its trim, gain, fades, bus and WAVE file;
- the binding of each speaker to the actor whose mouth moves;
- the score ducking under dialogue, when the film wants it;
- room-tone beds (`roomTone`) for a dialogue scene with no ambience recording, each with its frame interval, RMS level in dBFS, spectral tilt in dB per octave and seed.

Paths are relative to the production root. Line ids and cue ids are each unique within the film. A line plays at its own length from its start frame, so leave room before the next line and the film's end.

`pnpm run render` admits every receipt against its bytes, mixes the list into the soundtrack it encodes and writes the soundtrack's digest and each line's PCM digest to `render-report.json`. A missing file or a receipt that does not match its line is refused by path or field.

## Adopted line receipts

Store each generated line as a mono 32-bit float WAVE file at the model's own rate, with a version 7 receipt (`IAutoMovieProductionTtsReceipt`) beside it. The receipt records:

- the line id and the exact text sent to the generator, which match the sound list;
- the model, its immutable revision, the voice name or reference digest, and every inference argument;
- the sample rate, the sample count and the SHA-256 of the samples;
- the cache key over the text, model, revision, conditioning and inference arguments, as the type's documentation defines it;
- the phoneme chunks on the model's sample clock, when the model returns them.

Generate the file once and keep the bytes; record a line again rather than editing its file or receipt.
