# Speech timing probes

The three original English dialogue takes were generated serially with official local VoxCPM2.0.3 clone on CPU, using shared fictional adult identity references. [Provenance](../../assets/audio/probes/provenance.json) retains exact text, performance controls, local model revision, reference hashes, runtime source and candidate status. [Measurements](../../assets/audio/probes/measurements.json) identifies each saved WAV by SHA-256 and actual decoded frames. No outside person's recording or actor likeness supplied the voices.

[The reconstructed dialogue request](../prompts/voices/quidditch-rescue-dialogue.md) maps every submitted text/control field to actual source anchors and post-generation source identities. [The independent voice-reference record](../prompts/voices/carina-and-harry-voice-references.md) identifies the shared neutral probes without inventing a story ancestor. [Retention and restoration](generation-handoff.md#retention-and-restoration) owns their ignored local availability and exact-byte recovery limits; this migration did not change these timing observations or WAV bytes.

| Intended line | Saved mono frames at48,000Hz | Duration | Provisional placement |
| --- | --- | --- | --- |
| Carina: You lose today, Potter. |76,800|1.60seconds|4.00–5.60seconds, within0–8 opening|
| Harry: You almost had it. |61,440|1.28seconds|54.00–55.28seconds, within53–60 ending|
| Carina: Then don't fall next time. |76,800|1.60seconds|57.00–58.60seconds, within53–60 ending|

The retained candidate speech totals4.48seconds. The ending's two files occupy2.88seconds of its seven-second allocation, leaving4.12seconds for the looks, response space, shifted seating room and final steady image. These are container-duration allocations, not accepted audible starts, performed action lengths or a proved60second edit. No trimming, time stretching, subtitle alignment or mix was performed.

The measurement command uses this production's tracked [host](../../scripts/measureSpeechProbes.ts) and the installed public `decodeProductionAudioAsset` API. The decoder validates complete supported RIFF/WAVE, source rate/channels/frame count and finite samples; the host requires nonempty mono48kHz source and records peak, RMS and saturation. All five retained WAVs, including the11.04second female and8.80second male references, decode successfully with zero saturated samples. This is signal integrity evidence, not intelligibility, accent, voice continuity or acting judgment.

Auditory review remains unperformed because the enabled tools expose no usable listening channel. Generation input is intended text, not a recognized transcript. The takes and references remain `candidate-unheard`; browser play events or a waveform would not resolve this limitation. Future audio acceptance must hear the actual words and performances before adopting them in a film. The whole motion, final mix, caption timing, v2v result and rendered duration are also unmade.
