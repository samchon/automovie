# Local dialogue candidates

The dedicated duel producer generated all four frozen English screenplay lines through the installed official VoxCPM 2.0.3 `clone` command. All four invocations exited 0. The setup worker granted one exclusive CPU slot after the Quidditch batch; the producer released it immediately after the fourth take, before measurement or documentation. No dialogue was rewritten, accelerated, trimmed or regenerated in response to one partial observation.

The source checkpoint, parameters and two copied fictional identity reference digests are in [retained inputs](../../references/index.md). Each invocation used the matching reference with an expression-only control, CPU inference, no optimization or denoiser, CFG 2 and ten timesteps. This stable CLI has no seed control. The fixed candidate bytes are in `public/audio/dialogue-candidates/`; the exact four request texts, controls and exits are retained in `.cache/voice-generation-status.json` with four raw CLI logs. Generation is outside deterministic replay.

| Candidate | Frozen text | Expression control | CLI duration |
| --- | --- | --- | --- |
| `01-harry-ready.wav` | Ready? | A relaxed playful challenge, natural short question, conversational volume. | 4.80 seconds |
| `02-carina-are-you.wav` | Are you? | A composed light challenge with a small rising question, restrained conversational volume. | 0.64 seconds |
| `03-harry-save-me.wav` | Did you just save me? | Surprised recognition after physical exertion, one natural breath, a direct quiet question. | 1.28 seconds |
| `04-carina-look-at-me.wav` | Look at me this time. | Composed after catching a breath, a lightly teasing invitation with personal warmth held back, conversational volume. | 1.28 seconds |

The public `@automovie/ingest` WAVE decoder independently measures the saved files through the tracked shared host `../snitch-before-you/scripts/measureSpeechProbes.ts`. Its actual consumer writes [the measured report](voice-probes.json), including exact frames, source sample rate/channel count, original-byte SHA-256, sample peak, RMS and saturation count. The raw measurement report is `.cache/voice-probe-measurement.log`. This host accepts nonempty mono 48000 Hz probes and performs no arbitrary resampling. It is a sibling production's explicit shared helper, not a package API or an ignored executable script.

No auditory-capable inspection tool is available in this session. These takes and the identity references remain unheard candidates; neither waveform checks nor CLI success verifies transcript, British pronunciation, performance, noise or speech onset/offset. The unusually long untrimmed “Ready?” candidate particularly needs actual listening before any silence trim or acceptance. The two opening candidate containers total 5.44 seconds inside the provisional opening nine-second window, and the closing two total 2.56 seconds inside twelve seconds. Those arithmetic bounds leave time on paper but establish no synchronized action, spoken intelligibility or assembled 60-second edit. No candidate is wired into the empty starter or adopted as a finished soundtrack.
