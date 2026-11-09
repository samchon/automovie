---
name: audio
description: Describes a production's audio for the video-diffusion prompt and, only when the user asks to hear voices while reviewing the 3D hint film, makes a voice preview. Use when writing a shot's sound into a generation prompt or when the user requests a voice preview.
---

# Audio

Video diffusion produces the film's audio, voices, effects and ambience alike, from its prompt, so the production's audio work is to describe what each shot sounds like in the [generation](../production/generation.md) prompt, from the screenplay's speech and sound decisions. Review here judges the film from still frames, which carry no sound, so authored audio cannot be tuned and serves as reference at most; sound is decided in the prompt. No stage or delivery waits on a soundtrack, and a direct 3D film is silent unless its commission asks for sound.

Generate audio only when the user asks to hear the voices while reviewing the 3D hint film. Make that preview with [local speech](local-speech.md) or another speech service under [acquisition and listening](acquisition.md), adding [sound effects](sound-effects.md) only when the user asks for them too, and play it with the hint film in the Viewer. A preview is a review convenience: it is never delivered or required, and the diffusion prompt still carries the film's sound. Source changes follow [development](../development/SKILL.md).
