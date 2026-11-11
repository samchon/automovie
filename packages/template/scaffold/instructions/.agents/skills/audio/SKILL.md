---
name: audio
description: Decides what each shot sounds like for the video model to generate, makes a voice preview when the user wants to hear voices before video generation, and builds a soundtrack only when the commission asks for one, always for the user to accept by ear. Use when writing a shot's sound into a generation prompt, when the user requests a voice preview, or when a soundtrack is commissioned.
---

# Audio

Because [you cannot hear](../../../AGENTS.md#what-you-can-observe), you measure what decoded bytes show and the user accepts every sound by listening. Audio work has three cases. Source changes follow [development](../development/SKILL.md).

## Generated sound

A generated film's voices, effects and ambience come from the video model, which generates them in sync with the picture. The production's audio work is to decide what each shot sounds like, from the screenplay's speech and sound decisions, and write it into that shot's prompt in the selected model's syntax under [video](../video/SKILL.md).

The model times and lip-syncs speech inside the clip it generates, so keep each shot's lines speakable at a natural pace within that clip's duration, about one or two short exchanges per four seconds.

When the selected model or mode generates no sound, report it to the user with two choices, a sound-generating model or mode, or a separate video-to-audio pass over the accepted take, and follow their choice.

## Voice preview

Make a preview only when the user wants to hear the voices before video generation. Use [local speech](local-speech.md) or another speech service under [acquisition](acquisition.md), adding [sound effects](sound-effects.md) only when the user asks for them too, and ask the user to play it alongside the motion hint and listen. A preview is never delivered or required, and the video prompt still carries the film's sound.

## Commissioned soundtrack {#commissioned-soundtrack}

A motion hint and a direct 3D film are silent unless the commission asks for sound, and no stage waits on a soundtrack nobody commissioned.

When one is commissioned, record its tracks and loudness target in the [delivery profile](../production/project-context.md), acquire its material under [acquisition](acquisition.md), build it under [sound effects](sound-effects.md), and have the user listen at every acceptance: each adopted take, each mixed passage with its picture, and the delivered file.

Record which takes and passages the user heard, because a measurement cannot stand for a listening.
