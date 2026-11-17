# Film sound

Each take of a generated film brings its own sound, so once the takes are finished, film sound finishes the film's sound across them, under the user's listening. Its [loudness](#loudness) target serves any film with sound. Beds, effects and score come through [acquisition](acquisition.md) and this skill's sound effects page.

## Separation

A take's sound is one mix of speech, effects, ambience and any music. Before re-voicing a line or replacing a bed, separate the speech from the rest, change the part that needs it and mix it back. Few separation tools are proven on film mixes, so choose one that:

- separates dialogue, music and effects stems, because a voice-only tool discards the bed;
- is proven on real film mixes rather than synthetic ones, where effects are the hardest stem;
- returns stems that sum back to the original mix at its level;
- is licensed for commercial use in its weights, not only its code;
- supports the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech.

## One bed and one score per scene

Ambience generated per request jumps at every cut and music generated per request restarts. A video-to-audio pass, whose models work on clips of a few seconds, jumps the same way, so keep that pass for close effects. Lay one continuous bed per scene under its cuts, ducking or replacing each take's own ambience at the joins and filling gaps with room tone. Lay the score the screenplay gives a scene as one separate track.

## Loudness

Every delivered film with sound has a loudness target in the [delivery profile](../production/project-context.md). Ask the user for the release's integrated loudness with its tolerance, whether it is measured over the whole programme or gated on dialogue, and its maximum true peak, such as -23 LUFS over the whole programme and -1 dBTP under [EBU R128](https://tech.ebu.ch/publications/r128). Measure on the decoded mix, by [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) with dialogue gating where the target asks for it, that loudness and true peak meet the target and that every spoken line rises over the bed.

Keep dialogue, music and effects on separate tracks through the whole mix, so the stems and any music-and-effects mix the profile asks for can be exported; a generated take's speech reaches its own track only through [separation](#separation).
