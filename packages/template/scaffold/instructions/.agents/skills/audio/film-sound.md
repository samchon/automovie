# Film sound

A generated film's takes each bring their own sound, so the film's sound is finished across them after the takes are accepted, under the user's listening. This page owns that work.

## Separate before changing

A take's sound is one mix of speech, effects, ambience and any music. Before re-voicing a line or replacing a bed, separate the speech from the rest with a dialogue, music and effects separation model, change the part that needs it, and mix it back. Check the separation model's license, since some are trained on non-commercial data.

## One bed and one score per scene

Ambience generated per request jumps at every cut, and music generated per request restarts. Lay one continuous bed per scene under its cuts, ducking or replacing each take's own ambience at the joins, and fill gaps with room tone. Score a scene that has music as one separate track, and exclude music from its requests' prompts.

## Faces and dialogue

The polygon man has no face, so a face's performance comes from the take. Where a take's lips miss the accepted dialogue, re-sync the face of the accepted take from the dialogue audio with a dubbing model, which keeps the hint's blocking, rather than regenerate it. Where speech carries a shot and the request's [adherence](../video/requests.md#adherence) is speech and reaction, a model that takes the dialogue audio, and a pose video where offered, can generate the shot from it.

Lip sync holds best on a visible, mostly frontal face. With several speakers, use a model that binds one audio track to each person.

Examples: [InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk), which dubs an existing video; [MultiTalk](https://github.com/MeiGen-AI/MultiTalk), for several speakers; [Wan2.2-S2V](https://github.com/Wan-Video/Wan2.2), which takes an image, audio and a pose video together.

## Loudness

Every delivered film with sound has a loudness target in the [delivery profile](../production/project-context.md). Ask the user for the release's, such as -27 LKFS dialogue-gated for Netflix or -23 LUFS under EBU R128 for broadcast, and measure the mix as [sound effects](sound-effects.md#edit-with-picture) sets.

Sources: [MERL cocktail-fork separation](https://github.com/merlresearch/cocktail-fork-separation), [Stable Audio 3](https://github.com/Stability-AI/stable-audio-3), [Netflix sound mix specification](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5), [EBU R128](https://tech.ebu.ch/publications/r128), [Kling lip sync](https://kling.ai/document-api/api/video/lip-sync.md).
