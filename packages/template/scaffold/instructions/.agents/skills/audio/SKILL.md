---
name: audio
description: Decides what each shot sounds like for the video model to generate and, only when the user wants to hear voices before video generation, makes a voice preview for the user to listen to. Use when writing a shot's sound into a generation prompt or when the user requests a voice preview.
---

# Audio

The agent observes a film only as extracted image frames and cannot hear, so it cannot judge or tune audio it produces. The film's voices, effects and ambience therefore come from the video model, which generates them in sync with the picture, and the production's audio work is to decide what each shot sounds like, from the screenplay's speech and sound decisions, and write it into that shot's prompt in the selected model's syntax under [video](../video/SKILL.md). The model times and lip-syncs speech inside the clip it generates, so keep each shot's lines speakable at a natural pace within that clip's duration, about one or two short exchanges per four seconds. No stage or delivery waits on a soundtrack, and a direct 3D film is silent unless its commission asks for sound.

When the selected model or mode generates no sound, report it to the user with two choices, a sound-generating model or mode, or a separate video-to-audio pass over the accepted take, and follow their choice.

Only the user can hear the result, so any audio the agent makes exists for the user's ears. Generate audio only when the user wants to hear the voices before video generation. Make that preview with [local speech](local-speech.md) or another speech service under [acquisition](acquisition.md), adding [sound effects](sound-effects.md) only when the user asks for them too, play it with the hint film in the Viewer and ask the user to listen. A preview is never delivered or required, and the video prompt still carries the film's sound. Source changes follow [development](../development/SKILL.md).
