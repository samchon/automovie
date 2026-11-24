# Commissioned soundtrack

Record a commissioned soundtrack's tracks in the [delivery profile](../production/project-context.md#the-delivery-profile) with the [loudness](film-sound.md#loudness) target, acquire its material under [acquisition](acquisition.md) and build it under [sound effects](sound-effects.md). Have the user listen at every acceptance [listening](listening.md#user-listening) names.

A direct 3D film's dialogue belongs to its soundtrack, and [direct film](../video/direct-film.md#faces-and-speech) times the mouths to it.

Write a generated score's request under [music prompts](diffusion/prompts.md#music), then adopt its take under acquisition.

## Sound list

Declare a direct 3D film's adopted lines, cues, speaker-to-actor bindings and any score ducking as its production's `sound` member, an `IAutoMovieFilmSound` whose JSDoc defines each field. Leave `delivery.audio.path` unset, because the render refuses a film that declares both.

Give a dialogue scene without an ambience recording seeded `roomTone` beds. A bed at −50 dBFS or louder keeps the pauses between lines out of the delivery's silence check, and beds that meet on one frame crossfade.

A line plays at its own length from its start frame, so leave room before the next line and the film's end.

The README render command admits every receipt against its bytes and mixes the list into the soundtrack it encodes. It refuses a missing file or a receipt that does not match its line, naming the path or field.

## Adopted line receipts

Store each generated line as a mono 32-bit float WAVE file at the model's own rate, with a version 7 `IAutoMovieProductionTtsReceipt` beside it. The receipt records the exact text sent, the model's immutable revision, the voice, every inference argument, the samples' digest and any phoneme chunks, as its JSDoc defines them.

Generate the file once and keep the bytes. Record a line again rather than editing its file or receipt.
