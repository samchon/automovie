# Generated sound

A generated film's voices, effects and ambience come from the video model, in sync with the picture. Decide each shot's sound from the screenplay's speech and sound decisions, and write it into the request's prompt under [video prompts](../video/diffusion/prompts.md#sound).

The model times and lip-syncs speech inside the clip it generates, so keep each request's lines speakable at a natural pace within its length, about one or two short exchanges per four seconds.

A description and seed can yield different voices across requests. Define each voice once in the [shared description](../video/diffusion/prompts.md#shared-description). Supply the user's accepted reference where speaker binding is supported.

Ask the user to listen across takes for a voice that drifts, and re-voice a drifted line through [performance conversion](diffusion/cloning.md#performance-conversion) in the accepted voice.

When the chosen model or mode cannot supply commissioned sound, report it to the user with these choices, and record theirs in [project context](../production/project-context.md):

- a sound-generating model or mode;
- video-to-audio on the accepted take for effects and ambience without speech
- speech made apart from the take.

Source separate speech under [acquisition](acquisition.md) and sync it under [partial repair](../video/finishing.md#partial-repair). Check each video-to-audio or lip-sync model's [terms](acquisition.md#source-choice).
