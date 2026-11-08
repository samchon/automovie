# Generation records and retained media review

This independent narrow review covers the two voice request records, their complete seven dialogue and two copied-reference population, the subsequently added shared-image reuse index, and the [current generation handoff](../analysis/generation-handoff.md). It applies [asset source and control](../../.agents/skills/contracts/assets.md#source-and-control) and [reproducible handoff](../../.agents/skills/contracts/delivery.md#reproducible-handoff) against the current canonical generation-record guide. It does not reopen narrative acceptance or accept voices, sound, motion or a film.

## Source and request inspection

The complete manual inspection round found no source/request/retention defect. I read both request records, the exact payload and runtime receipts, inventory, measurements, current and frozen screenplay, both character settings, README, reference index, timing/handoff analyses, ignore rules and actual measurement/render consumers before reaching this result. Historical launch source hashes, full original shell transcripts, submission timestamps and provider-internal payloads remain unknown; the records correctly label their reconstruction and current source correspondence.

Raw complete-file SHA256 values independently matched the recorded identities:

| Inspected source or receipt | SHA256 |
| --- | --- |
| Current screenplay | `a721acc3c2d872f02b85d56a26a2181e3ebeba938873423bfb50bc5eb26e265d` |
| Frozen construction | `7bf5413f4c7ad265676bcfa2b7f463a2c80b86c11b7334bca31a6427334b282a` |
| Carina settings | `87919dad5420fb3e7eeb13337cbd481881248fdf5a423063cb4a23c5079d1040` |
| Harry settings | `d99c107edbd5b4c97e57ff20d83e9a5743a4580f6d20167c73285a999bfd8e73` |
| Exact dialogue payload | `5d32d7f5326cb0365356485aac692f086f19c743d13f79738d901ea82632435b` |
| Runtime receipt | `2fff87bbddcfd03cbb2bfd05511f00640960a181078159e3e514642381b625b3` |
| Existing decoder measurements | `ee33dcf1825d9591e8e06f14dadc45b5b0c5387c4039d43084713e6e50d87c60` |

All seven exact `text` and `control` fields agree between the tracked payload and [dialogue record](../prompts/voices/three-oclock-dialogues.md). Every utterance matches both screenplay editions literally at `courtyard-invitation`; the record identifies its speaker and time span. The controls have these actual source relationships:

| Payload entry | Performed words and control correspondence |
| --- | --- |
| 0 | “Potter. On Saturday...” at 0–13 seconds; Carina's youthful British baseline, with firm onset and uncertainty explicitly owned as acting interpretation. |
| 1 | “Saturday. Three. Don't be late.” at 0–13; clipped rehearsal ends and intelligible consonants/no shouting correspond to Carina's second settings paragraph. |
| 2 | “I just wanted to go with you.” at 13–25; screenplay `(quieter)` and settings' slower, lower-volume vulnerability support the control. |
| 3 | “All right.” at 13–25; Harry's conversational British baseline supports identity; warmth/no teasing is a declared production choice. |
| 4 | “How long have you been there?” at 25–36; discovery/concealment supports the declared startled interpretation, with baseline clear/no-shout delivery. |
| 5 | “Three o'clock.” at 48–60; voluntary completed transfer supports the declared recovered composure/warmth interpretation. |
| 6 | “I heard.” at 48–60; Harry's conversational baseline and closing action support the declared soft/dry-affection interpretation. |

Both settings H2/paragraph locators and literal excerpts are usable. These present source matches do not establish which complete source edition was read at generation. The separate [reference record](../prompts/voices/carina-and-harry-voice-references.md) preserves the runtime receipt's complete neutral text and both exact design controls as independent setup-author choices. It invents no narrative ancestor for them. Adult mezzo/light-baritone, southern variety and microphone descriptors are separated from the roughly sixteen-year-old characters' baselines; audible age, timbre and pronunciation remain unverified.

## Actual bytes, consumers and retention

I opened all nine local files as bytes and independently checked every inventory byte size and SHA256 against the existing measurement receipt: all match. The two copied anchors also match their actual external originals under `D:/Program Files/VoxCPM/samples`. The complete population totals 3,318,156 bytes: 1,904,728 anchor bytes and 1,413,428 dialogue bytes. All nine have RIFF WAVE PCM16 headers; the existing public-decoder round owns their mono 48 kHz, finite samples, frames, peak/RMS and zero-saturation observations. Its per-file frames/durations match the inventory, including the untrimmed 2.88-second appointment take and 14.72-second dialogue total. No decoder was rerun for this review.

The inventory connects Carina's anchor to entries 0, 1, 2, 4 and 5 and Harry's to 3 and 6. The seven save logs corroborate the original result paths and durations; the payload retains seven exit-zero observations. Exact CLI fields, runtime/model revision, absent seed support and the distinction between reconstructed argv and an unobserved internal payload are explicit. No crop, resample, trim or synchronization input is invented.

The actual shared `snitch-before-you/scripts/measureSpeechProbes.ts` reads and hashes original bytes, calls public `decodeProductionAudioAsset`, validates the mono 48 kHz profile and writes the retained measurement shape. I inspected it and the production source, scripts and render configuration. The WAVs have measurement/documentation consumers only; the empty scene and renderer contain no audio binding or `audioMix`. This review ran no synthesis, playback, export, compiler or new waveform measurement and grants no auditory/transcript/acting acceptance.

Git checks confirm all nine exact WAV filenames are ignored and none is already tracked. `/media/generated/` and `/output/` are ignored without a blanket extension exclusion. Both prompt records, payload/runtime/inventory/measurement JSON and handoff Markdown remain Git-eligible. Relative links from the changed records, README and reference index resolve. The README, inventory and handoff accurately state local-only availability, owner-mediated restoration of all nine original paths followed by SHA256 verification, and the lack of a verified durable archive or restore test. The external anchors cannot restore the seven generated outputs. Retention remains required while current consumers depend on these bytes; regeneration would create another candidate. Future renderer receipt/output retention is explicitly assigned to tracked `docs/analysis` with original digests and retained locators.

## Shared-image reuse addendum

The complete affected inspection round over [the local image index](../prompts/images/shared-character-references.md), README/reference-index/handoff additions, shared PROJECT/README, both canonical requests and payloads, their receipt, both retained PNGs and this production's two frozen source snapshots found no reuse-chain defect. The local index links the canonical shared owners rather than duplicating a prompt or image. Both local settings still match the pre-call snapshots at their recorded raw hashes; source-at-generation identity belongs to those shared request records and is not rewritten by this consumption index.

| Shared input independently checked | Actual retained identity |
| --- | --- |
| Carina PNG | `ac4532a5ccf24983da713bd583a3a78865348754be5ee5d4db35660d105dc1a9`, 1,956,120 bytes |
| Harry PNG | `ca90414aa540259d8649a07e80cd72e0d14e0bd9124495f6b337603b79e33023`, 1,949,680 bytes |

Each shared PNG matches its actual tool-original file, and PNG headers confirm 1024 by 1536, eight bits per RGB channel with no alpha. The exact payload hashes match their canonical request receipts. I directly viewed both retained PNGs: single full-body adult portraits, pale-blond/green Carina and untidy-dark-haired/round-glasses/red Harry, visible hands and footwear, plain studio floor/background. Harry's small forehead scar is visible. The index correctly limits these observations to static reference cues.

The adoption text preserves local sixteen-year-old age, 1.66/1.70-metre heights, Carina's above-shoulder hair and simple polygon presentation. Loose shoulder-length hair, adult proportions, photographic fabric/boots, neutral pose and studio surroundings remain shared reference-design choices; the image establishes no calibrated height, anatomy, wardrobe requirement or invitation performance. Harry's scar is not silently added to local canon. Suitability for the younger characters, Human fit and any image-conditioned shot remain unverified. The canonical receipts report one shared call per person; this consuming production makes no additional generation claim.

Both shared originals are locally available at the linked library paths, ignored under its `/media/generated/` rule, with their small payloads/records/receipt and local adoption index Git-eligible. All added relative links resolve. Restoration requires obtaining these exact PNGs from their owner and checking their digests; no archive/restore test or redistribution assessment is claimed. Current consumers are documentation/registry only. No local image copy, generation, edit, geometry recovery or film adoption was introduced. The earlier voice audit remains unchanged; a later scene-completeness revision will require a separate current-source correspondence refresh while retaining the original historical requests and comparison editions.

## Native coverage and preserved proof

These exact source/request/media/retention bindings were checked manually. The current `evidence.config.ts` selects source and short-with-settings narrative duties; neither asset/delivery question has a selected respondent here. This addendum adds no fictional native coverage or narrative stage.

The initial plugin-enabled CLI check exited 2 during lint-config emission because its source changed concurrently; `.cache/generation-sync-before.txt` preserves that failed attempt. The supported `ttsx --no-plugins` CLI precheck exited 1 for thirteen planned instruction updates plus scaffold state, with no conflicts; apply exited 0 for those same fourteen paths. The producer confirmed the actual post-sync process exited 0 with no changes in `.cache/generation-sync-after.txt`. The installed generation-record guide at that initial inspection exactly matched the canonical guide's SHA256 `43fe9257f51145a9a96dea6c444b2085eed21936de38358a347ef44d2dabda0a`. The shared-image reuse inspection above is complete; final instruction sync for the subsequent central reuse-policy update and the migration's one coordinated final unfiltered native result remain pending. This reviewer will inspect those receipts without duplicating native execution.

The original final unfiltered receipt remains unchanged in scope: 25/25 active claims, 42/42 obligations, 73/73 units, zero incomplete/missing, one error and zero warnings. Its sole `graph-stale-review` retains closed construction token `#11f99dd` against current H2 `#c92432a`. This review neither replaces that token nor renews the closed review. Story, canon, frozen/working editions and earlier review judgments are outside this addendum's authority.

## Current scene-completeness correspondence and retention audit

This later independent manual round covers the completed replacement's generation correspondence and retained dependencies only. The initial observations above remain historical outcomes. I reread both complete voice records, the shared-image index, payload/runtime/inventory/measurement owners, current promoted and frozen scene, both unchanged hero baselines, note, brief/profile, handoff, README/reference index, ignore/attribute policy and current sync/retention receipts. The complete inspection found no generation/source-correspondence or byte-retention defect; no author repair was required.

The appended [current correspondence](../prompts/voices/three-oclock-dialogues.md#current-source-correspondence) and inventory agree with these independently hashed raw files:

| Current correspondence source | Raw SHA256 |
| --- | --- |
| Promoted scene | `e6573c8b01e79de3633584f7e6a97549d4d64b3c5604aaca628b1fe7f6a76c84` |
| Frozen construction | `8311399a3850b43494cdb57a8d0c0ee785df2ff8cc2cf14cf6108c98633def70` |
| Reviewed working file | `6c02da63ebdec46d08812280ea510b66f50d918606fb6e0adbf8b5423b1375bb` |
| Project scope | `f29acb24afb0f0a511206cecaeb88c33410cd7d6715f654645a14cd50ef6b355` |
| Current brief | `755e720e17cd98baf95f856325f2b1cc89ed6b30f3e24990c8ea0c0c7872f863` |

All seven exact payload utterances match their literal speakers in current promoted, frozen and working files. Their order, five provisional windows and the quieter invitation cue agree with the mapping. The unchanged controls retain the original declared acting interpretations and character-baseline ancestry. Five bound unspoken notes preserve spatial/support execution within the current scene; the correspondence record uses them as later source context, without claiming new generator inputs or accepted motion. The new place/bench/sound description introduces no executed speech, Foley, image, model or video request. The note withdrawal and receiving-fingers-before-release literals still support the declared invitation/handoff context. This is request correspondence, not renewed narrative or performance approval.

Every one of the 53 predecessor manifest entries still exists with its exact recorded size and SHA256. The historical scene/profile pointers now resolve to the actual retained predecessor bytes: promoted `a721acc3…e265d`, frozen `7bf5413f…4b282a`, profile `073c37b3…b787716`. Their full identities and first retrospective status remain in the voice record. Unknown launch hashes/timestamps remain unknown; no later hash replaces them. Current ignored frozen/working files, predecessor comparisons and raw reports are correctly disclosed as additional local restoration dependencies. Obtain owner copies at the recorded paths and verify their digests; neither a fresh checkout nor the promoted scene recreates a different frozen construction. No durable archive or restore test is claimed.

I rehashed all nine local WAVs and both shared PNGs against their respective inventory/receipt identities and sizes; all eleven match, remain ignored and untracked, and retain the earlier measured formats and voice durations. Both external setup originals and both image tool-original files also match their referenced copies. Payload `5d32d7f5…2435b`, runtime `2fff87bb…625b3` and measurement `ee33dcf1…87c60` raw SHA256 values remain unchanged. Both hero and note files retain their earlier identities. Small request/receipt/measurement records are Git-eligible; the selective WAV rules, shared generated-image exclusion and future generated/export exclusions do not replace retention. The current handoff states owner-mediated restoration, digest verification and local-only availability. All affected relative links resolve. Source/tests/render configuration still contain no adopted WAV, PNG or `audioMix` binding. Adult reference appearance and unheard adult voice candidates remain separate from local roughly sixteen-year-old canon, heights, hair and polygon presentation.

The two original CRLF receipts have exact-path `-text` rules only. I independently ran paired raw/filtered `git hash-object` checks from the workspace root with each actual repository-relative input and matching `--path`:

| Receipt | Original CRLF sequences | Equal raw and filtered Git object |
| --- | --- | --- |
| `synthesis-commands.json` | 58 | `170ff91bb76242c5381c33737738fa46780e3619` |
| `voxcpm-runtime.json` | 81 | `0f71e93c16c64ade49fe91616468b77abd2b7bd7` |

Git reports `text: unset`, inherited `eol: lf`, and unspecified filter/working-tree encoding for both. Their byte-preserving rule works without a filter or encoding workaround. The retained failed report records two earlier false mismatches caused by combining production-directory execution with a root-prefixed `--path`; the corrected root-context receipt states that method error explicitly. No original receipt bytes or attributes were changed to force agreement.

The latest [instruction receipt](../analysis/instruction-sync.json) records the actual completed no-change CLI check, exit 0, with `.cache/scene-completeness/sync-final-check.txt`. Its five adopted resources independently match canonical raw bytes:

| Resource | Canonical and local SHA256 |
| --- | --- |
| `production/generation-records.md` | `a4abf6a411b636387b3a652c10c33acc2eb094ea396a772622b7834ba5b8a8b5` |
| `screenwriting/discovery.md` | `33b548de230761a078e1668f4a029c1caa403e2b7d8f5b8856133f516d009f4b` |
| `screenwriting/settings.md` | `aad840288030725ddfda73e43b88636678c0629b67bb60b50cd0dd650e04e2ad` |
| `screenwriting/settings-records.md` | `0afff2fd51cc5d6563934093fcdfba4ac21f8bf6c874b91b0c98d8519ad33f65` |
| `screenwriting/screenplay.md` | `2bfcf82fc1870b9aad06ac0a571e7dbc17d32f205d219bcd146ca8b2688aa0e8` |

This current manual scope is clean. Final source checks and post-transfer unfiltered native results remain pending their coordinated execution and receipt inspection. This reviewer ran no decoder, synthesis, compiler, playback or native check. Native coverage remains the graph's selected source/narrative duties; these request/source/retention bindings remain manually audited. Historical approvals and the current closed construction/expression tokens were not rewritten by this review.

## Final receipt inspection

The coordinated final receipts are now complete and supersede the pending status immediately above. I read the actual lint, test, build and unfiltered Evidence logs, [source manifest](../analysis/source-checks.json), [final native receipt](../analysis/final-native.json), current validation and handoff. This completed receipt inspection found no new generation/handoff inconsistency. I ran no duplicate compiler, test, decoder, synthesis or native command.

The source receipt records fresh actual exit 0 for lint, tests and build after the transfer-helper/configuration changes. The test log reports 3/3 scaffold functions; the build log reports 1592 transformed modules and the 581.59 kB bundle with its retained over-500-kB warning. All 22 recorded input hashes still match the actual files, including transfer helper `d980b1bb8812d7ca179d0687a5ea74e7a8a411079c41c7cbdc4d5f7280569dd6` and Evidence configuration `ef16e9081419584d749736d7bb9d019224aa1c6e32b10c66cfb263f50be984cd`. The receipt records unchanged inputs during that round and explicitly limits its dependency population; these checks are current observations, not carried earlier passes.

The actual final unfiltered native log has SHA256 `06e0b17321739930abcec180bf25af75e8e57464094a12b3d63fdc24d71d3f81`. It reports exit 1, 25/25 active claims, 43/43 obligations, 75/75 coverage, zero incomplete/missing, exactly one error and zero warnings. Its sole `graph-stale-review` is construction review line 7: closed `#3e76020` versus promoted H2 `#7aa3ec1`. The actual review retains that original construction token, frozen raw `8311399a…def70` remains unchanged, and expression review still retains `#6455951` with working raw `6c02da63…75bb`. The earlier 28/28 settings, 60/60 construction and 75/75 expression pre-transfer closure logs have zero diagnostics in their own scopes. None rewrites the predecessor's separate 73/73, one-error historical outcome.

Current promoted/frozen/working/profile/brief hashes still equal the independently checked current-correspondence table, and all affected handoff/validation/request/index/README links resolve. Current validation states a qualified authoring handoff with the actual one-error result; it does not imply strict full validation, voice acceptance or a completed film. The manual generation/source/retention audit is closed clean for these exact inputs and retained media identities. The native stale-review qualification and all unperformed listening, motion, film and archive-restoration observations remain explicit.
