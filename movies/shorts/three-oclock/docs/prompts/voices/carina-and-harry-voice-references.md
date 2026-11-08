# Carina and Harry voice reference candidates

These are two existing generated neutral setup anchors copied into this production as speech-cloning inputs. This reconstructed record does not claim that this producer generated them or that they are dialogue from this story. The original setup owner is `/root/voxcpm_setup`; original files remain outside Git at `D:/Program Files/VoxCPM/samples/{carina,harry}-identity-reference.wav`. This production copied each file byte-for-byte to its inventory locator. No crop, trim, resample or other derivative transform was applied.

## Setup source and recorded request {#setup-source}

[The copied runtime receipt](../../../references/audio/voxcpm-runtime.json), SHA256 `2fff87bbddcfd03cbb2bfd05511f00640960a181078159e3e514642381b625b3`, owns the exact recorded neutral text and voice controls. Its `referenceText` is:

```text
The courtyard is quiet now. Take a moment and catch your breath. There is no need to hurry. Tell me when you are ready, and we will begin again together.
```

This independent technical-probe text has no screenplay/settings ancestor. It is setup author material chosen to provide a sustained identity reference. An earlier planning sentence in the conversation is not substituted for the actual retained receipt. The original complete shell command, source-at-launch digests and execution timestamps were not captured in the production, so those historical fields remain unknown. The receipt identifies official VoxCPM 2.0.3 voice design, the model revision and common CPU/no-optimize/no-denoiser/CFG-2/ten-step settings. External save logs corroborate final paths and 11.04/8.80-second durations; they are supplementary receipts rather than the sole location of required request text.

The observable setup request can be reconstructed as the official executable's `design --text <referenceText> --control <voiceControls member> --model-path <model> --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10 --output <original anchor path>`. This reconstruction is not a retained literal original shell transcript or proof of an unobserved provider-internal rewrite. No external actor recording, negative/system/role prompt, time-matched input or supported seed is recorded. The snapshot's Apache-2.0 attribution and official source links identify the runtime/model provenance; no separate external recording license is invented.

## Carina identity input {#carina-reference}

The receipt's exact `voiceControls.carina` is:

```text
Young adult woman, clear mezzo voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone
```

The actual generated original is copied to `references/audio/anchors/carina-reference.wav`, 1,059,884 bytes, SHA256 `2375289dbc2641ad515f3b7a784870baafe658005060773e714fb33fdef65ed4`, 529,920 frames, mono 48 kHz, 11.04 seconds. [The artifact inventory](../../../references/audio/generation-records.json) links its retained original and five actual clone consumers: opening rehearsal, command, invitation, discovered question and appointment time. The copied bytes and measured identity are verified; listening is not.

Retrospective story correspondence is limited: [Carina's historical baseline](sources/carina-pre-uniform-baseline.md#carina), raw SHA256 `87919dad5420fb3e7eeb13337cbd481881248fdf5a423063cb4a23c5079d1040`, paragraph 2 calls for "youthful, female, middle-to-upper pitched, clear and lightly bright, with contemporary British pronunciation." The broad female/British/clear identity overlaps the setup intention, but mezzo, southern regional variety, calm pacing and microphone quality are setup author choices, not exact canonical requirements. The record's "Young adult" voice description did not establish the earlier roughly sixteen-year-old character's audible fit, and does not establish the current about-fifteen cast's fit. Suitability and timbre continuity remain pending auditory inspection; character canon was not changed to match a generated anchor.

## Harry identity input {#harry-reference}

The receipt's exact `voiceControls.harry` is:

```text
Young adult man, light baritone voice, contemporary southern British English, calm natural speech, unhurried pace, clean close microphone
```

The actual generated original is copied to `references/audio/anchors/harry-reference.wav`, 844,844 bytes, SHA256 `851fdb643b79bbb005a3f58a82edb1d273754905845232d73a7d8663099b9a6c`, 422,400 frames, mono 48 kHz, 8.80 seconds. The inventory identifies its two actual clone consumers, Harry's acceptance and closing reply. Both original external anchor locations are local dependencies, not public URLs or durable archives.

[Harry's historical baseline](sources/harry-pre-uniform-baseline.md#harry), raw SHA256 `d99c107edbd5b4c97e57ff20d83e9a5743a4580f6d20167c73285a999bfd8e73`, paragraph 1 specifies "youthful male voice is middle pitched, softly rough, lightly resonant and conversational, with ordinary contemporary British pronunciation, unhurried replies and no imitated film actor." Male/British/unhurried intention overlaps; light baritone, southern regional variety, calm neutral test delivery and close microphone are setup author choices. These do not prove the requested middle-pitched youthful/softly rough result. The historical about-sixteen source and current about-fifteen canon are separate epochs; neither age-fit is accepted by these unheard bytes.

## Availability, consumers and acceptance {#availability-and-use}

Both copies match their original receipt digests and the [public-decoder measurements](../../../references/audio/dialogue-measurements.json). They supply unpaired identity references to the seven actual speech requests in [the dialogue record](three-oclock-dialogues.md), not synchronized motion controls or extra performed movie dialogue. The measurement host decoded them, while no scene/render soundtrack uses them. All nine WAVs are locally retained only; no durable archive or tested restoration is claimed. Restore both anchor copies and every required dialogue take from the owner's retained bytes using the exact paths/digests in the inventory before reuse. An ignored fresh checkout has no WAV bytes. No media was moved, deleted or regenerated in this migration.

## Later visual-casting boundary {#later-visual-casting}

The later [approximately-fifteen image-casting correction](../../../PROJECT.md#current-visual-casting) supplies a new visual requirement separately from the earlier about-sixteen profile comparisons above. It changes no exact neutral text, adult-designed control, runtime receipt or WAV. These unheard anchors and derived takes have no established teenage apparent-age fit or soundtrack acceptance. The current student image is not a new source-at-generation claim for older audio requests.
