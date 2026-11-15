# Film sound

A generated film's takes each bring their own sound, so film sound finishes it across them once the takes are [finished](../video/finishing.md), under the user's listening; its [loudness](#loudness) target serves any film with sound. Its beds, effects and score come through [acquisition](acquisition.md) and [sound effects](sound-effects.md).

## Separation

A take's sound is one mix of speech, effects, ambience and any music. Before re-voicing a line or replacing a bed, separate the speech from the rest, change the part that needs it, and mix it back. Few separation tools are proven on film mixes, so choose one by these criteria:

- separate dialogue, music and effects stems, since a voice-only tool discards the bed;
- results on real film mixes rather than synthetic ones, where effects are the hardest stem;
- stems that sum back to the original mix at its level;
- a license for commercial use covering the weights, not only the code;
- support for the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech.

## One bed and one score per scene

Ambience generated per request jumps at every cut, and music generated per request restarts; a video-to-audio pass, whose models work on clips of a few seconds, jumps the same way, so use it for close effects. Lay one continuous bed per scene under its cuts, ducking or replacing each take's own ambience at the joins, and fill gaps with room tone. Lay the score the screenplay gives a scene as one separate track.

## Loudness

Every delivered film with sound has a loudness target in the [delivery profile](../production/project-context.md). Ask the user for three things of the release's target: integrated loudness with its tolerance, whether it is measured over the whole programme or gated on dialogue, and the maximum true peak, such as -23 LUFS over the whole programme and -1 dBTP under EBU R128. Measure on the decoded mix, with [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) and dialogue gating where the target asks for it, that loudness and true peak meet the target and every spoken line rises over the bed.

Keep dialogue, music and effects on separate tracks through the whole mix, so the stems and a music-and-effects mix the profile asks for can be exported; a generated take's speech reaches its own track only through separation.

Sources: [iZotope RX Scene Rebalance](https://www.izotope.com/en/learn/scene-rebalance), [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation), [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4), [MERL cocktail-fork separation](https://github.com/merlresearch/cocktail-fork-separation), [EBU R128](https://tech.ebu.ch/publications/r128), [MMAudio](https://github.com/hkchengrex/MMAudio).
