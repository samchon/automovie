# Film sound

A generated film's takes each bring their own sound, so the film's sound is finished across them once the takes are [finished](../video/finishing.md), under the user's listening. This page owns that work; its beds, effects and score come through [acquisition](acquisition.md) and [sound effects](sound-effects.md).

## Separate before changing

A take's sound is one mix of speech, effects, ambience and any music. Before re-voicing a line or replacing a bed, separate the speech from the rest, change the part that needs it, and mix it back. Choose the separation tool by these, because few are proven on film mixes:

- separate dialogue, music and effects stems, since a voice-only tool discards the bed;
- results on real film mixes rather than synthetic ones, where effects are the hardest stem;
- stems that sum back to the original mix at its level;
- a license for commercial use covering the weights, not only the code;
- the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech. Examples: [iZotope RX Scene Rebalance](https://www.izotope.com/en/learn/scene-rebalance) and [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation) give dialogue, music and effects stems; among open models, check each checkpoint's license, as some are non-commercial.

## One bed and one score per scene

Ambience generated per request jumps at every cut, and music generated per request restarts. Lay one continuous bed per scene under its cuts, ducking or replacing each take's own ambience at the joins, and fill gaps with room tone. Score a scene that has music as one separate track, and exclude music from its requests' prompts.

## Faces and dialogue

The polygon man has no face, so a face's performance comes from the take. A take whose lips miss the accepted dialogue is re-synced to it as a picture repair under [finishing](../video/finishing.md#repair-part-of-a-take).

## Loudness

Every delivered film with sound has a loudness target in the [delivery profile](../production/project-context.md). Ask the user for the release's, such as -27 LKFS dialogue-gated for Netflix or -23 LUFS under EBU R128 for broadcast, and measure the mix as [sound effects](sound-effects.md#edit-with-picture) sets.

Sources: [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4), [MERL cocktail-fork separation](https://github.com/merlresearch/cocktail-fork-separation), [Stable Audio 3](https://github.com/Stability-AI/stable-audio-3), [Netflix sound mix specification](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5), [EBU R128](https://tech.ebu.ch/publications/r128).
