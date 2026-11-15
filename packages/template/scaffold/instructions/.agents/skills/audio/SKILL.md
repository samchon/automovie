---
name: audio
description: Decides what each shot sounds like for the video model to generate, finishes a generated film's sound across its accepted takes, makes a voice preview when the user wants to hear voices before video generation, and builds a soundtrack only when the commission asks for one, always for the user to accept by ear. Use when writing a shot's sound into a generation prompt, finishing a generated film's sound, when the user requests a voice preview, or when a soundtrack is commissioned.
---

# Audio

Audio work serves a generated film's sound, its finishing across takes, a voice preview and a commissioned soundtrack. Because [you cannot hear](../../../AGENTS.md#what-you-can-observe), measure what the decoded bytes show and have the user accept every sound by listening. Source changes follow [development](../development/SKILL.md).

| Task | Read |
| --- | --- |
| Decide a shot's sound for its video request | [Generated sound](generated-sound.md) |
| Finish a generated film's sound across its takes | [Film sound](film-sound.md) |
| Make a voice preview | [Voice preview](acquisition.md#voice-preview) |
| Build a commissioned soundtrack | [Commissioned soundtrack](soundtrack.md) |
| Find, license and adopt speech, music or recordings | [Acquisition](acquisition.md) |
| Build and place effects and beds | [Sound effects](sound-effects.md) |
