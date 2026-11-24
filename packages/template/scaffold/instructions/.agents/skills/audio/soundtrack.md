# Commissioned soundtrack

Record a commissioned soundtrack's tracks in the [delivery profile](../production/project-context.md#the-delivery-profile) with the [loudness](film-sound.md#loudness) target, acquire its material under [acquisition](acquisition.md) and build it under [sound effects](sound-effects.md). Have the user listen at every acceptance [listening](listening.md#user-listening) names.

A direct 3D film's dialogue belongs to its soundtrack, and [direct film](../video/direct-film.md#faces-and-speech) times the mouths to it.

Write a generated score's request under [music prompts](diffusion/prompts.md#music), then adopt its take under acquisition.

## Sound list

Declare a direct 3D film's adopted lines, cues, speaker-to-actor bindings and any score ducking as its production's `sound` member, an `IAutoMovieFilmSound` whose JSDoc defines each field. The README render command mixes it into the soundtrack it encodes. Adopt each line's file and receipt under [take adoption](acquisition.md#take-adoption). Leave `delivery.audio.path` unset, because the render refuses a film that declares both.

Give a dialogue scene without an ambience recording seeded `roomTone` beds. A bed at −50 dBFS or louder keeps the pauses between lines out of the delivery's silence check, and beds that meet on one frame crossfade.

A line plays at its own length from its start frame, so leave room before the next line and the film's end.

## Loudness record

Write the delivery profile's [loudness](film-sound.md#loudness) targets in the delivery intent's `loudness` record, with a separate dialogue target when dialogue sits at its own level. Without the record, the render applies EBU R 128: −23 LUFS, 0.5 LU and −1 dBTP.

The render levels each adopted line to the dialogue target and refuses a line that needs more than 12 dB either way, so regenerate such a line nearer the target. `IAutoMovieLoudnessIntent` sets how the render brings the mix to the targets, and the README names the loudness failures that block publication.
