# Candidate dialogue timing

All nine exact utterances in [the manifest](dialogue-probes.json) were generated through official local VoxCPM 2.0.3 pure voice design, then decoded from the fixed WAVs by the tracked `scripts/measureSpeechProbes.ts` consumer of public `@automovie/ingest`. Both speaker batches completed: Carina 4/4 and Harry 5/5, both process exits 0. Runtime/model revision, CPU, environment, controls, no-optimize/no-denoiser, CFG 2 and ten inference steps follow `D:/Program Files/VoxCPM/runtime.json`. The installed version exposes no seed.

The retrospective [request/source record](../prompts/voices/paper-crane-dialogues.md) now preserves both exact input lists and nonsecret request fields with their historical limits. [The small fixed-byte measurement receipt](paper-crane-dialogue-measurements.json) is an exact versionable copy of the original ignored report below; its digest and original locator remain attributable to the same measurement run. This migration changes no WAV or timing value.

These are candidate technical probes. No auditory or transcription tool was available to verify words, pronunciation, voice suitability, noise or cross-take identity. Shared identity anchors were not used; matching generic adult voice descriptions do not prove stable timbre across this short or the other productions. No candidate has been adopted into playback or a final soundtrack.

Every saved source decoded as finite mono 48 kHz PCM, with zero full-scale samples. The largest absolute sample peak was 0.815521240234375. The report records each source frame count, exact-byte SHA256, peak and RMS at `.cache/audio-probes/measurements.json`, SHA256 `722eb16e13e25a14a47f3b6dd6d91dcdbda4c57985e47efa96fe2f55c83d1861`; the command exited 0. Decoder admission of finite samples and these statistics establish technical facts, not listening acceptance. WAVs, exact speaker-order input lists, generation logs, statuses and complete measurement data remain in ignored `.cache/audio-probes`.

| ID and exact requested speech | Saved source beneath `.cache/audio-probes` | Frames | Untrimmed seconds | WAV SHA256 |
| --- | --- | ---: | ---: | --- |
| 01 Carina: “Potter.” | `carina/output_001.wav` | 46080 | 0.96 | `637fa52378da4cc058befc7566b490f8d63419284ef8219e3633ffe78854582f` |
| 02 Harry: “Is this yours?” | `harry/output_001.wav` | 69120 | 1.44 | `c51841fdf6fa44b020a36a6aa7dedba92dc535d5ead012caea63d658d990bfb5` |
| 03 Carina: “Wrong note. Give it back.” | `carina/output_002.wav` | 99840 | 2.08 | `aef5c362986693619300c33551a90185681e0b38899971b7c0717accaab921e9` |
| 04 Harry: “Of course.” | `harry/output_002.wav` | 38400 | 0.80 | `d0aa5972565c3f29e391ef1b73a6a344a59b1b0fd66b58a9e15ac7b739f9e26d` |
| 05 Harry: “Wait.” | `harry/output_003.wav` | 38400 | 0.80 | `8321866fe3001219a5c1ea8e65013fcf80da04390a604bd94d5a6757ab996345` |
| 06 Harry: “I read it.” | `harry/output_004.wav` | 53760 | 1.12 | `7b401667f3d85f2fb94c3ebee5602b2615524157357ae64af50c63e0d524eb18` |
| 07 Carina: “Then forget it.” | `carina/output_003.wav` | 53760 | 1.12 | `4ad9b5c6d354d776fbf154ac34fcb4e0202e721b378f9aa046b825d0d05812f6` |
| 08 Harry: “Your tea's getting cold.” | `harry/output_005.wav` | 107520 | 2.24 | `f9f3b4a7d4615a9ed990b4d9cff6e516f550ceb0b7e6092ddc81a47f0abbfa1b` |
| 09 Carina: “That one's yours.” | `carina/output_004.wav` | 69120 | 1.44 | `2d6f422a73efb3a31d5239baaf75c871f4da75e8d53d16f34f913a45db0286a8` |

The complete untrimmed container total is 12.00 seconds, including any leading/trailing silence. The first silent nine seconds require no take. Requested lines in 00:09–00:19 total 4.48 seconds; 00:19–00:32 total 1.60; 00:32–00:43 total 2.24; 00:43–01:00 total 3.68. This identifies no speech-container overrun by itself, but it does not prove the crowded physical middle or final seventeen seconds fit. The readable inscription, approach/return, supported transfers, choice pause, careful sitting and final hold still require full staged timing and playback. No trims, time stretching, word alignment or final line positions are approved by these measurements.
