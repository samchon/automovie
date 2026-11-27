# Film sound

Finish generated takes' sound together and verify it with the user. Follow the loudness target for any film with sound. Source beds, effects and score through [acquisition](acquisition.md) and sound effects.

## Separation

<!-- @reference [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4) evaluates film stems. [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation) is a commercial implementation. -->

Separate speech from the mix before replacing lines or beds. Change the required stem and remix. Choose a separator by these criteria:

- separates dialogue, music and effects stems
  - A voice-only tool discards the bed.
- proven on real film mixes, where effects are the hardest stem
  - Synthetic mixes alone are insufficient.
- returns stems that sum back to the original mix at its level;
- is licensed for commercial use in its weights, not only its code;
- supports the film's sample rate and channels.

Test it on the production's own takes, shouts and breaths included, and have the user listen to the separated speech.

## One bed and one score per scene

Keep per-clip generated audio for close effects. Run one ambience bed across scene cuts, ducking or replacing take ambience and filling gaps with room tone. Keep the screenplay's score on a separate track.

## Loudness

Record the release's integrated loudness target and tolerance, measurement scope and true-peak limit in the [delivery profile](../production/project-context.md#the-delivery-profile). Ask the user which release specification applies, such as [EBU R 128](https://tech.ebu.ch/publications/r128).

A direct 3D film sets these targets in its render loudness record.

Measure on the decoded mix, by [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) with dialogue gating where the target asks for it, that loudness and true peak meet the target and that every spoken line rises over the bed.

Keep dialogue, music and effects on separate tracks through the whole mix, so the stems and any music-and-effects mix the profile asks for can be exported; a generated take's speech reaches its own track only through separation.
