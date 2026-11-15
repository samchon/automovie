# Film sound

Film sound finishes the mix of any film with sound, under the user's listening. A generated film's takes each bring their own sound, so its sound is finished across them once the takes are [finished](../video/finishing.md). Its beds, effects and score come through [acquisition](acquisition.md) and [sound effects](sound-effects.md).

## Separate before changing

A take's sound is one mix of speech, effects, ambience and any music. Before re-voicing a line or replacing a bed, separate the speech from the rest, change the part that needs it, and mix it back. Few separation tools are proven on film mixes, so choose one by these:

- separate dialogue, music and effects stems, since a voice-only tool discards the bed;
- results on real film mixes rather than synthetic ones, where effects are the hardest stem;
- stems that sum back to the original mix at its level;
- a license for commercial use covering the weights, not only the code;
- the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech.

## One bed and one score per scene

Ambience generated per request jumps at every cut, and music generated per request restarts. Lay one continuous bed per scene under its cuts, ducking or replacing each take's own ambience at the joins, and fill gaps with room tone. Score a scene as one separate track.

## Loudness

Every delivered film with sound has a loudness target in the [delivery profile](../production/project-context.md). Ask the user for the release's, such as -27 LKFS dialogue-gated for Netflix or -23 LUFS under EBU R128 for broadcast. Measure on the decoded mix that every spoken line rises over the bed and that loudness, measured as [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) defines it, reaches the target.

Sources: [iZotope RX Scene Rebalance](https://www.izotope.com/en/learn/scene-rebalance), [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation), [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4), [MERL cocktail-fork separation](https://github.com/merlresearch/cocktail-fork-separation), [Netflix sound mix specification](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5), [EBU R128](https://tech.ebu.ch/publications/r128).
