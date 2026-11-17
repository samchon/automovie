# Generated sound

A generated film's voices, effects and ambience come from the video model, in sync with the picture. Decide each shot's sound from the screenplay's speech and sound decisions, and write it into the request's prompt under [video prompts](../video/diffusion/prompts.md#sound).

The model times and lip-syncs speech inside the clip it generates, so keep each request's lines speakable at a natural pace within its length, about one or two short exchanges per four seconds.

A character's generated voice can change between requests, even with the same description and seed. Describe each voice once in the [shared description](../video/diffusion/prompts.md#shared-description), and where the model binds reference audio to a character, give it the voice the user accepted, such as a [voice preview](acquisition.md#voice-preview).

Ask the user to listen across takes for a voice that drifts, and re-voice a drifted line through [performance conversion](diffusion/cloning.md#performance-conversion) in the accepted voice.

When the selected model or mode generates no sound, report it to the user with these choices, and record theirs in [project context](../production/project-context.md):

- a sound-generating model or mode;
- a video-to-audio pass over the accepted take, which adds effects and ambience but no speech;
- speech made apart from the take.

Speech made apart from the take comes through [acquisition](acquisition.md) and is synced onto the take's faces under [partial repair](../video/finishing.md#partial-repair). Check a video-to-audio or lip-sync model's license as [source choice](acquisition.md#source-choice) checks any asset, because several are non-commercial or exclude regions.
