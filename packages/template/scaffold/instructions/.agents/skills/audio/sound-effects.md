# Sound effects

Effects are built in two cases only: the user asks for them with a requested voice preview, or a [soundtrack is commissioned](SKILL.md#commissioned-soundtrack). A generated film's effects come from the video model's prompt.

Define each cue by its event, source material, action, intensity, distance and acoustic space. Choose a recording, self-recorded Foley or purpose-built generator that can express those qualities. Keep close effects separate from ambience and speech so their timing and perspective remain editable.

## Acquire a sound

[Freesound](https://freesound.org/) provides searchable recordings with per-asset licenses; filter for [CC0](https://creativecommons.org/publicdomain/zero/1.0/) when public raw-file redistribution is needed, or evaluate [CC BY](https://creativecommons.org/licenses/by/4.0/) with its credit requirements. [OpenGameArt](https://opengameart.org/) also provides sound packs with licenses on their asset pages.

Inspect the individual source, recording method and terms rather than treating a site's free catalog as one license. Follow [acquisition](acquisition.md) for adoption and delivery rights.

Record Foley when the required material or movement is missing. Capture isolated variations with useful intensity and perspective differences.

When generating, describe the source, action and recording character, have the user audition a short result, then select variations before expanding.

[Stable Audio](https://github.com/Stability-AI/stable-audio-3) is one purpose-built option; its current model documentation owns setup, controls and output rights. Evaluate those rights separately from the inference code's license.

## Edit with picture

Select dry takes that match the depicted event; layer, trim and shape them to distinguish contact types and intensities. Set each cue from its measured onset, end it with its event and decay, and place it through gain, pan and room sound consistent with the scene. Use movement sound for a pass-by and contact sound for an impact.

Cap overlapping instances per sound and per source, as game engines bound [sound concurrency](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Engine/FSoundConcurrencySettings?lang=en-US), and duck beds and effects under speech.

For a commissioned soundtrack, measure on the decoded mix that every spoken line rises over the bed and that loudness, measured as [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) defines it, reaches the target the [delivery profile](../production/project-context.md) records, which may be dialogue-gated.

Ask the user to listen to the complete working passage with moving picture at normal speed, replaying uncertain contacts and transitions, and to report synchronization, repetition, perspective and balance with speech and ambience together.

Hand accepted bytes and measured cues to [assembly](../production/assembly.md) for a commissioned soundtrack, and ask for the affected listening again after either picture or sound changes.
