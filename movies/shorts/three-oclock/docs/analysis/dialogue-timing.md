# Actual local speech timing probes

All seven official VoxCPM clone commands exited 0 with retained bytes, exact requested text, per-line performance controls, reference identities and runtime settings. The shared tracked `snitch-before-you/scripts/measureSpeechProbes.ts` host was read before reuse and decoded both anchors and all seven outputs through the installed public `@automovie/ingest` decoder. It exited 0. Each file is nonempty mono 48 kHz, all decoded samples are finite and saturated samples are zero; digests, source frames, peak and RMS are in `references/audio/dialogue-measurements.json`. These are candidate probes; no words or acting have been accepted by listening.

| Scene interval | Retained candidates and decoded durations | Speech total | Interval left for action and pauses before overlap choices |
| --- | --- | --- | --- |
| 0–13 | Carina first rehearsal 2.24 s; command 3.04 s | 5.28 s | 7.72 s for two approaches, returns, turns and failed holds. |
| 13–25 | Carina request 2.24 s; Harry acceptance 0.80 s | 3.04 s | 8.96 s for third approach, visible entrance and freeze. |
| 25–36 | Carina discovered question 1.28 s | 1.28 s | 9.72 s for concealment/turn, offered palm and withdrawn transfer. |
| 36–48 | No spoken take | 0 s | 12 s for release, landing, shared low reach, gentle contact, recovery, stopped retry and retreat. |
| 48–60 | Carina time 2.88 s; Harry reply 2.24 s | 5.12 s | 6.88 s for pickup, grip, exit, two touches/smiles and sound tail. |

The untrimmed seven candidates total 14.72 seconds. No silence was trimmed, no sound stretched and no take regenerated to fit a written timestamp. The first and last windows have the tightest speech-plus-action budgets; the silent gag also needs its real body performance and hesitation pauses. The remaining-time calculation is an arithmetic planning boundary, not proof of feasible motion or a 60-second edit. Future performance can overlap only the speech/action relations that the screenplay actually allows; actual continuous playback must preserve recognition, ownership and comic response before total duration is accepted.

The setup owner's 11.04-second Carina and 8.80-second Harry neutral reference WAVs retain exact SHA256 values `2375289dbc2641ad515f3b7a784870baafe658005060773e714fb33fdef65ed4` and `851fdb643b79bbb005a3f58a82edb1d273754905845232d73a7d8663099b9a6c`. They are technical identity candidates, not extra scene dialogue. Actual transcript, timbre, pronunciation, noise, emotional delivery and synchronization remain unverified because no auditory inspection was available. Nothing in this report accepts a soundtrack or claims completed motion, video or diffusion.
