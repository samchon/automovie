# Retained alternatives for line 026

Exactly two seeds were declared before generation: `9426` and `19426`. The canonical text, Soult style, generated reference waveform, VoxCPM snapshot and generation settings match the original take. Each seed was attempted once with `retry_badcase=False`; neither result was replaced or selected during generation. All takes remain `candidate-unheard`.

Run: `2026-10-29T17:23:05.700026+00:00`. Complete: `True`.

| Seed | Seconds | Tiny raw recognition | Base raw recognition |
| --- | ---: | --- | --- |
| 9426 | 1.28 | Yes, Sire. | Yes, Sire. |
| 19426 | 2.08 | Yes, Sire. | Yes, Sire. |

The [raw record](candidates.json) retains exact inputs and their hashes, both new waveforms, measurements, model revisions, actual word times, decoder parameters and failed attempts. ASR receives no expected text, captions or original transcript. Neither agreement with the intended words nor a larger model establishes listening or acting acceptance.

Original assets and the selected mix are not written by this script. The protected-input digest comparison records whether they changed during this isolated run. Its raw record preserves the unselected result at generation time.

The coordinator subsequently verified both waveform digests and made an explicit [provisional selection](../../../../public/audio/001-road/selection.json) of seed 9426 for the repaired edit. Both candidates matched the canonical words in two unprompted recognizers; the first declared seed also has a measured duration closer to the original 1.44 seconds. The distinct selected WAV is copied into public audio without replacing the original take or its index. The overlay, source and actual mix must be consumed and checked together; this selection supplies no listening or acting acceptance.

This script refuses a second run in the same directory after a record exists, preserving the declared two-attempt population. Run only with the adopted isolated Python runtime and existing `HF_HOME`.
