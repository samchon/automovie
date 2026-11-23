# Film sound

Finish generated takes' sound together and verify it with the user. Follow the loudness target for any film with sound. Source beds, effects and score through [acquisition](acquisition.md) and sound effects. A direct 3D film declares its adopted lines, their receipts and its cues in its [sound list](soundtrack.md#sound-list), which the render mixes.

## Separation

<!-- @source [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4) evaluates film stems. [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation) is a commercial implementation. -->

Separate speech from the mix before replacing lines or beds. Change the required stem and remix. Choose a separator by these criteria:

- separates dialogue, music and effects stems, because a voice-only tool discards the bed;
- is proven on real film mixes rather than synthetic ones, where effects are the hardest stem;
- returns stems that sum back to the original mix at its level;
- is licensed for commercial use in its weights, not only its code;
- supports the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech.

## One bed and one score per scene

Keep per-clip generated audio for close effects. Run one ambience bed across scene cuts, ducking or replacing take ambience and filling gaps with room tone. A direct 3D film without a room-tone recording declares seeded `roomTone` beds in its [sound list](soundtrack.md#sound-list); a bed at −50 dBFS or louder keeps the pauses between lines out of the delivery's silence check, and beds that meet on one frame crossfade. Keep the screenplay's score on a separate track.

## Loudness

Record the release's integrated loudness target and tolerance, measurement scope and true-peak limit in the [delivery profile](../production/project-context.md#the-delivery-profile). Ask the user which release specification applies, such as [EBU R128](https://tech.ebu.ch/publications/r128).

A direct 3D film also writes those targets in its delivery intent's `loudness` record: `integratedLufs`, `toleranceLu`, `maximumTruePeakDbtp` and, when dialogue sits at its own level, `dialogueLufs`. The render levels each adopted line to the dialogue target, which is `integratedLufs` without `dialogueLufs`, and refuses a line that needs more than 12 dB either way; regenerate such a line nearer the target. It then brings the mix to `integratedLufs` under a true-peak limiter 1 dB below `maximumTruePeakDbtp`, because encoding can raise true peak. It checks the decoded `film.mp4` against the same targets and blocks a miss. Without the record it uses EBU R 128: −23 LUFS, 0.5 LU and −1 dBTP. `render-report.json` records which targets applied, each line's gain and the measured loudness and true peak.

Measure on the decoded mix, by [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) with dialogue gating where the target asks for it, that loudness and true peak meet the target and that every spoken line rises over the bed.

Keep dialogue, music and effects on separate tracks through the whole mix, so the stems and any music-and-effects mix the profile asks for can be exported; a generated take's speech reaches its own track only through separation.
