# Carina and Harry voice references

The later complete-scene revision reuses these exact two reference WAVs. [The current source/media correspondence](../../analysis/scene-generation-correspondence.json) independently records their retained hashes and unchanged Carina/Harry profile identities. Their neutral setup requests and independent fictional-design ancestry below remain historical; neither was conditioned on the later scene, and no new design, clone, transform or listening acceptance is implied by reuse.

## Record boundary and runtime {#record-boundary}

This record was reconstructed after generation on 2026-11-04. It documents two fictional adult voice-design outputs made by the shared `/root/voxcpm_setup` worker and copied, byte-for-byte, into this production as identity references for [the four duel lines](duel-dialogues.md). The neutral design is an independent technical setup task, not a screenplay performance. No settings file or screenplay was submitted as a model input, and this record does not invent that ancestry. The setup worker's exact process-boundary argv, per-attempt source-file hashes, wall-clock submission times and provider-internal rewritten prompt were not captured in the Duel receipt and remain unknown. The available local CLI output logs establish saved outputs; the existing runtime and reference index establish the reported fields below. Neither establishes an audio transcript or listening approval.

The selected local tool is official VoxCPM 2.0.3, operation `design`, model `openbmb/VoxCPM2` revision `32279effe8c19989596f05d353d1447f51d9e915`. The retained operational fields are CPU, `--no-optimize`, `--no-denoiser`, `--cfg-value 2` and `--inference-timesteps 10`. The installed stable CLI has no seed option. No separate negative, system or role text is recorded as supplied by the operator; a provider-internal prompt is unobserved. [The current runtime manifest](<D:/Program Files/VoxCPM/runtime.json>) was inspected retrospectively with raw-file SHA-256 `18fa35ad62b4960d97a49b59e530ec77294eb796baebe4c495bb70416ab34e06`; it is a subsequently updated shared manifest, not a generation-time snapshot. Model/code licensing is recorded as Apache-2.0 in that manifest; [official source](https://github.com/OpenBMB/VoxCPM) and [the model revision](https://huggingface.co/openbmb/VoxCPM2/tree/32279effe8c19989596f05d353d1447f51d9e915) identify the provider. These are generated fictional designs, not actor recordings or a supplied person's voice clone.

The executable is `D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe`; model path is `D:/Program Files/VoxCPM/models/VoxCPM2-32279effe8c19989596f05d353d1447f51d9e915`. The current runtime supplies `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8`, `OMP_NUM_THREADS=16`, `MKL_NUM_THREADS=16`, and local Hugging Face, ModelScope, Torch, XDG, Matplotlib, Numba and TEMP/TMP cache paths under the approved installation root. Their historical per-process environment was not snapshotted. No credential or authorization value is preserved here. These settings describe observed configuration and reported generation, not deterministic regeneration.

## Neutral reference words {#neutral-words}

The following is the exact requested neutral text retained in the shared runtime manifest and [the original production reference receipt](../../../references/index.md). It is setup material, not film dialogue and not a verified transcript:

```text
The courtyard is quiet now. Take a moment and catch your breath. There is no need to hurry. Tell me when you are ready, and we will begin again together.
```

The setup worker chose this material to provide a sufficiently long, low-pressure identity sample for later cloning. That is a delegated technical choice; none of its courtyard statements is a new fact about this film. Its exact original submission revision is unknown. There is no input recording, crop, trim, time-matched control, frame map or other reference supplied to the reported pure-design operation.

## Carina reference design {#carina-reference}

Exact retained voice-control string:

```text
Young adult woman, clear mezzo voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone
```

The setup worker selected the sex/life-stage, mezzo description, southern variety, neutral pace and microphone style as a fictional design. Current [Carina settings](../../body/settings/carina.md#carina), raw-file SHA-256 `71d563709964e113a304107cef21f41ba70d99ed5b7afae43f63f78bee51720f`, provide a retrospective compatibility check: paragraph 1 says “an adult witch in her early twenties”; paragraph 3 says “a clear adult British English voice in a medium-high range” with “restrained volume and a measured conversational tempo.” The exact mezzo, southern accent and microphone choices are not quotations from that setting and must not be presented as a user-fixed canonical requirement or a historically supplied source document. Actual vocal compatibility remains unheard.

A normalized command reconstructed from the reported fields follows. It is not a captured original argv and must produce a new candidate if rerun; it is not a restoration procedure for exact bytes:

```powershell
& 'D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe' design --text 'The courtyard is quiet now. Take a moment and catch your breath. There is no need to hurry. Tell me when you are ready, and we will begin again together.' --control 'Young adult woman, clear mezzo voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone' --model-path 'D:/Program Files/VoxCPM/models/VoxCPM2-32279effe8c19989596f05d353d1447f51d9e915' --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10 --output 'D:/Program Files/VoxCPM/samples/carina-identity-reference.wav'
```

The retained final CLI log is `D:/Program Files/VoxCPM/samples/carina-identity-reference.log`, currently SHA-256 `314ad8bdb443fc831e25672beed4d6270b2c3c567738b1c1e44d4be6a36b4900`; it states `Saved audio to:` the named file `(11.04s)`. The setup receipt reports successful completion and technical checks, but the original numeric process exit receipt is not retained in this production. A preceding interrupted Carina identity-design log also survives at `D:/Program Files/VoxCPM/samples/carina-identity-reference.interrupted-2026-11-04.log`; it ends during inference without a saved-output line. Its exact historical payload and output availability are unknown here. It is retained as a known interrupted attempt, not silently replaced with a claim that it used the final request.

Original saved output and the [local copied reference](../../../references/audio/carina-identity-reference.wav) have SHA-256 `2375289dbc2641ad515f3b7a784870baafe658005060773e714fb33fdef65ed4`, 1059884 bytes, 529920 frames, mono 48000 Hz, 11.04 seconds. The local copy is an unchanged dependency of Carina's two clone calls. It remains a generated, unheard candidate, not an accepted voice or a time-matched picture control.

## Harry reference design {#harry-reference}

Exact retained voice-control string:

```text
Young adult man, light baritone voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone
```

This is another setup-worker design choice, without a supplied voice recording. Current [Harry settings](../../body/settings/harry.md#harry), raw-file SHA-256 `5d1eddb2ad341d554d1601efb27e74c63098262fb3ab410747939e0ddf586cb6`, retrospectively match the adult British goal: paragraph 1 says “an adult wizard in his early twenties”; paragraph 3 gives “medium-low, lightly rough” and “an unforced conversational pace.” The exact light-baritone, southern-variety and close-microphone controls are technical design choices, not historically captured settings ancestry. Actual range, timbre and accent have not been heard or accepted.

```powershell
& 'D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe' design --text 'The courtyard is quiet now. Take a moment and catch your breath. There is no need to hurry. Tell me when you are ready, and we will begin again together.' --control 'Young adult man, light baritone voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone' --model-path 'D:/Program Files/VoxCPM/models/VoxCPM2-32279effe8c19989596f05d353d1447f51d9e915' --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10 --output 'D:/Program Files/VoxCPM/samples/harry-identity-reference.wav'
```

This command has the same reconstructed, non-verbatim status as Carina's. The final log `D:/Program Files/VoxCPM/samples/harry-identity-reference.log`, currently SHA-256 `d71a39d189ace5efafca5051e7a5192334e832497b874e85932966f21a01e38d`, states `Saved audio to:` the named file `(8.80s)`. Numeric original exit status, exact submission time and any undocumented prior attempts are unknown in the Duel receipt.

Original output and the [local copied reference](../../../references/audio/harry-identity-reference.wav) have SHA-256 `851fdb643b79bbb005a3f58a82edb1d273754905845232d73a7d8663099b9a6c`, 844844 bytes, 422400 frames, mono 48000 Hz, 8.80 seconds. This unchanged local copy supplies Harry's two clone calls; there is no crop, resampling or other derivative.

## Availability and restoration {#availability}

Both local copies are `locally-retained-only`, ignored by the production's exact `references/audio/*identity-reference.wav` rule. They are present and digest-verified at this migration; no durable archive or archive restoration has been verified. Ignoring them changes Git tracking, not their local presence or usage dependency. The external installation also retains matching originals and `samples/identity-reference-analysis.json` (current SHA-256 `eb89210a6d7553198613006b9d15e7f113376f14632eff9f9c5a53c8707fc203`) with technical observations; those observations do not establish listening or transcript correctness.

On this machine, a missing project copy can be restored by copying the matching file from `D:/Program Files/VoxCPM/samples/` to the same `references/audio/` filename, then verifying raw-byte SHA-256 against the identity above. This requires local access to the approved installation, without credentials. On another checkout, obtain the exact files from their current local custodian and verify both digests before cloning; there is no verified archive URL or remote restore command. If neither copy exists, report the dependency unavailable. Re-running `design` is a new candidate and cannot restore these identities. Retain both copies and their required provenance while any clone candidate or later adopted sound depends on them.

## Later visual-casting boundary

The [current user correction](../../../PROJECT.md#current-visual-casting) targets student image appearance around fifteen. The original adult design controls, neutral reference text, runtime, WAVs and technical measurements in this record remain historical and unchanged. The candidates are unheard; student-cast age fit and soundtrack selection are pending. No new audio generation or acceptance is claimed.
