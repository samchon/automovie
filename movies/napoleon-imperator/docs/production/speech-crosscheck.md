# Two-take speech cross-check

This separate local ASR observation examines only `line-016` and `line-026` from the unchanged candidates. It preserves the original [tiny-model inspection](speech-diagnostics.md). Neither recognizer establishes the intended pronunciation or acting, and a larger model does not supply listening acceptance. Both takes remain `candidate-unheard`.

Run: `2026-10-29T17:14:12.743262+00:00`. Complete: `True`. Model: `openai/whisper-base.en` at `911407f4214e0e1d82085af863093ec0b66f9cd6`. Device: CPU, threads: 4.

Source, index, original inspection and WAV digests are verified before decoding and checked again afterward. Expected text, captions, prior transcripts and prompts are never supplied to the recognizer. Each whole untrimmed waveform is resampled to 16 kHz in memory.

| Take | Existing tiny recognition | Independent base recognition |
| --- | --- | --- |
| line-016 | Yes, I am. | Yes, Sire! |
| line-026 | Yes, I said... | Yes, I said. |

The [raw report](speech-crosscheck.json) preserves exact model revisions, versions, decoder parameters, word timestamps relative to each original take, input identities, failed attempts and any previous cross-checks. Timestamps are ASR estimates; zero-length or inaccurate word boundaries remain possible. The recognition results are observations, not corrected dialogue.

Setup failure: `none`.

Run in the adopted isolated runtime with its existing `HF_HOME`: `python scripts/crosscheck-speech.py --threads 4`. This script writes only these two cross-check reports and does not regenerate audio.

Reference: [official base-model card](https://huggingface.co/openai/whisper-base.en).
