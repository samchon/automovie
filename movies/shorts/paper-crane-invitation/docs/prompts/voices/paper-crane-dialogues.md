# Paper crane invitation dialogues

## Actual request population and historical boundary {#actual-requests}

This record reconstructs the two executed local VoxCPM speaker batches that produced nine candidate dialogue timing probes for [Give It Back, Potter](../../body/screenplay/give-it-back-potter.md#invitation). It was written after generation. The original executed CLI tool call, [dialogue manifest](../../analysis/dialogue-probes.json), retained speaker input lists, generation logs and [fixed-byte measurements](../../analysis/paper-crane-dialogue-measurements.json) are its evidence. It does not represent nine separate CLI invocations, an original captured provider payload or a new generation run. No image, video or model generation was performed for this production.

The [nonsecret reconstructed payload](paper-crane-dialogues.payload.json) owns the two commands, original paths, controls, parameters, attempt labels and observable completion. Its complete raw-file SHA256 at reconstruction is `6f0d1cb4e50c1edb999336eee2e19fd0c1b9d334bcc2914550ab717e3b3da99c`, not a historical provider payload digest. Local attempt labels are metadata, not provider job identifiers. The CLI exposed no request/job ID here. Generation-time hashes of the complete argv, individual control fields and runtime JSON were not captured and remain unknown. Hashes calculated for retained inputs, logs and current source correspondence during this migration are labeled accordingly. Later reconstruction does not turn them into contemporaneous request receipts.

## Carina timing batch {#carina-timing-batch}

The exact retained UTF-8 input is [Carina's four lines](inputs/paper-crane-carina-lines.txt), copied byte for byte from `.cache/audio-probes/carina.txt`, including its original line endings. Its raw-file SHA256 observed at migration is `29da1ab2ae7c84bdb831c4ef0b79911c6836aa882e0da96a2c04bf81733ff32b`. Nonblank lines 1–4 map to dialogue IDs 01, 03, 07 and 09. The exact control is the `carina` batch control in the payload and the matching control in the existing dialogue manifest. No per-line control override was supplied; these are timing probes, not verified emotional performances.

The actual command used `batch --input .cache/audio-probes/carina.txt --output-dir .cache/audio-probes/carina` with that control and the common model/parameters in the payload. The retained original log reports `Batch finished: 4/4 succeeded`; its exit file records 0. Original outputs remain `carina/output_001.wav` through `output_004.wav` below `.cache/audio-probes`. No retry, trim, conversion, resampling or replacement take was made in this production.

## Harry timing batch {#harry-timing-batch}

The exact retained UTF-8 input is [Harry's five lines](inputs/paper-crane-harry-lines.txt), copied byte for byte from `.cache/audio-probes/harry.txt`. Its raw-file SHA256 observed at migration is `a24dccf3146da85732557ef4e9fb9f13ce5373d99faae2543412453b8f826eae`. Nonblank lines 1–5 map to dialogue IDs 02, 04, 05, 06 and 08. The exact `harry` control in the payload matches the existing dialogue manifest; it was shared by all five lines.

The actual command used `batch --input .cache/audio-probes/harry.txt --output-dir .cache/audio-probes/harry` with that control and the common model/parameters. The retained original log reports `Batch finished: 5/5 succeeded`; its exit file records 0. Original outputs remain `harry/output_001.wav` through `output_005.wav` below `.cache/audio-probes`. The two batches executed serially in one coordinated CPU slot.

Both retained input-list copies contain their original CRLF line endings. The production's two exact `.gitattributes` entries unset text conversion for those files so the enclosing repository's LF normalization cannot silently change the submitted-byte evidence. Raw and path-filtered Git blob hashes must match, alongside the raw SHA256s above; no staging or object write is required to check that preservation. Other prompts and source text retain the repository's normal text policy.

## Spoken words and scene timing sources {#dialogue-source-map}

Every utterance corresponds verbatim to the single screenplay H2 `invitation`. The independently locked historical construction SHA256 `a888ed176997ef461a6e008e3f47a3ffbee4ba78b9d2af35b4e67908929a8f8c` existed before synthesis in `.cache/screenplay-construction-classification.md`. Its original working locator was `docs/revision/screenplay/give-it-back-potter.md`. The later scene-unit replacement preserves those exact bytes in the [Git-eligible historical construction snapshot](sources/paper-crane-dialogue-construction.md), also retained under `.cache/scene-completeness/predecessor/docs/revision/screenplay/give-it-back-potter.md`. The new current construction at the original locator is a separate edition.

This snapshot is historical source evidence, not current canon or an original provider-side receipt. Its internal relative markup is preserved historical text, not maintained navigation at the storage alias. The scene was authored under `docs/body/screenplay` and later frozen under the original `docs/revision/screenplay` locator; copying it did not rewrite those header links. Use the explicit source-owner links in this record for present navigation. Exact snapshot bytes and matching request strings were checked after generation. The original manifest locator remains unchanged as historical metadata; it does not prove which complete source edition was read at each call. No contemporaneous per-call source digest or complete source-read capture was emitted by VoxCPM, so that historical exact-read claim remains unknown. Both exact speaker input lists independently preserve what was submitted.

At the first post-generation record inspection, the final screenplay SHA256 was `6cceeed20af9765f0415868874a8a1b1dd89c2c1d4889f6a2927ce323e2643a3`. That predecessor is preserved under `.cache/scene-completeness/predecessor/docs/body/screenplay/give-it-back-potter.md`. Its difference from historical frozen construction is comment-separating whitespace from the reviewed transfer, not different dialogue. Line numbers below are historical frozen/predecessor-final respectively; they are not current line locators after the scene-completeness replacement. All rows identify the stable H2 and allocated scene span. The raw-file digest convention throughout is SHA256 of complete bytes, without newline or case normalization.

| Dialogue ID and exact inherited words | Historical frozen/predecessor-final line | Planned scene span | Actual batch input and output |
| --- | --- | --- | --- |
| 01 Carina: “Potter.” | 22 / 25 | 00:09–00:19 | Carina line 1 → `carina/output_001.wav` |
| 02 Harry: “Is this yours?” | 27 / 30 | 00:09–00:19 | Harry line 1 → `harry/output_001.wav` |
| 03 Carina: “Wrong note. Give it back.” | 30 / 33 | 00:09–00:19 | Carina line 2 → `carina/output_002.wav` |
| 04 Harry: “Of course.” | 35 / 38 | 00:19–00:32 | Harry line 2 → `harry/output_002.wav` |
| 05 Harry: “Wait.” | 40 / 43 | 00:19–00:32 | Harry line 3 → `harry/output_003.wav` |
| 06 Harry: “I read it.” | 53 / 56 | 00:32–00:43 | Harry line 4 → `harry/output_004.wav` |
| 07 Carina: “Then forget it.” | 65 / 68 | 00:32–00:43 | Carina line 3 → `carina/output_003.wav` |
| 08 Harry: “Your tea's getting cold.” | 72 / 75 | 00:43–01:00 | Harry line 5 → `harry/output_005.wav` |
| 09 Carina: “That one's yours.” | 79 / 82 | 00:43–01:00 | Carina line 4 → `carina/output_004.wav` |

The screen inscription “Would you have tea with me?” is visible writing, not a tenth speech request. The five screenplay intervals remain provisional staging/edit allocations. Measured speech containers do not establish line alignment, readable on-screen writing or complete action timing.

## Current correspondence after the scene replacement {#current-dialogue-correspondence}

This is a later source-correspondence epoch, not another generation request. After the separately authorized scene-completeness replacement completed its own construction and expression reviews, the official public-helper transfer wrote the reviewed comment-free edition to [the current screenplay, invitation](../../body/screenplay/give-it-back-potter.md#invitation). Its complete raw SHA256 is `84501c2893b8a898484896142f3815b9dfc9f4d24292e0b33397f4caff5eb996`, 5,507 bytes. The new frozen construction has the same digest; reviewed working bytes with two HTML comments containing ten answers are `efc9373b1fdbb411035c3c272bd896ec5e9e417d11b98ce300b6d0276b340f2f`. The public transfer and independent readback establish exact equality after removing only those comments; [the expression-cycle account](../../analysis/scene-naturalness.md#review-and-transfer) identifies its actual receipts.

All nine current utterances retain their exact historical speaker, words and order. Current final-body line locators are below; they refer to the current 84501c edition, not the historical A888 frozen source. Coincident line numbers in two editions do not equate their complete bytes.

| Existing dialogue ID | Exact current source words | Current final-body line | Provisional scene span and unchanged request binding |
| --- | --- | ---: | --- |
| 01 Carina | Potter. | 25 | 00:09–00:19; Carina input line 1 → `carina/output_001.wav` |
| 02 Harry | Is this yours? | 30 | 00:09–00:19; Harry input line 1 → `harry/output_001.wav` |
| 03 Carina | Wrong note. Give it back. | 33 | 00:09–00:19; Carina input line 2 → `carina/output_002.wav` |
| 04 Harry | Of course. | 38 | 00:19–00:32; Harry input line 2 → `harry/output_002.wav` |
| 05 Harry | Wait. | 43 | 00:19–00:32; Harry input line 3 → `harry/output_003.wav` |
| 06 Harry | I read it. | 56 | 00:32–00:43; Harry input line 4 → `harry/output_004.wav` |
| 07 Carina | Then forget it. | 68 | 00:32–00:43; Carina input line 3 → `carina/output_003.wav` |
| 08 Harry | Your tea's getting cold. | 75 | 00:43–01:00; Harry input line 5 → `harry/output_005.wav` |
| 09 Carina | That one's yours. | 82 | 00:43–01:00; Carina input line 4 → `carina/output_004.wav` |

The sole inscription remains “Would you have tea with me?” at current line 61 and is not submitted as speech. The current character identity owners and their hashes/excerpts in the voice table below remain unchanged. New finite-bay, bench/sill, cup-form, opening-footfall and backward-observation choices belong to current scene construction; this later correspondence does not assert that a historical generation call read them. The original manifest, two-batch payload, exact lists and nine WAVs were not edited, moved or regenerated. Matching request words establishes textual correspondence, while listening, transcript, performance, timbre and final synchronization remain unverified.

## Voice, identity and delegated control choices {#voice-source-map}

The exact request controls are preserved in the payload. This table maps their meaningful fields to actual creative owners and distinguishes new incidental recording choices. Nothing here claims a real actor's likeness, an adopted shared identity anchor or stable generated timbre.

| Request instruction | Source, raw-file SHA256 and literal support | Relationship to the request |
| --- | --- | --- |
| Carina: young adult woman; clear mezzo; brisk precise diction | [Carina, identity](../../body/settings/carina-malfoy.md#identity), `31a2109cb671fd0a51d1ae13b89d653f579cad2dba646c9bd2499cb513997d6f`, paragraphs 1–2: “invented 20-year-old”; “brisk demands and precise diction”; “a clear adult mezzo” | The control selects the adult voice, range and clipped opening tactic for technical probes. It does not certify the later softer emotional state. |
| Harry: young adult man; light baritone; relaxed attentive conversation | [Harry, identity](../../body/settings/harry-potter.md#identity), `f48db9ea1123aefadbd9c8cf838b0a774494b3ea5c3c661fb007d38546766c43`, paragraphs 1–2: “invented 20-year-old”; “generic young-adult light baritone, conversational and slightly breathy”; “starts relaxed and becomes attentive” | The control compresses these baseline voice/attention facts into a generic conversational direction; it does not alter his knowledge or relationship. |
| Contemporary English; no impersonation | [Brief, audience/language](../../instructions/brief.md#audience-experience-and-language), `6bdf96505d433a85a606b59ff6e545dfd76bd24c1f6fb012c532aa891991772a`, paragraph 1: “Use plain contemporary English and short lines”; “without imitated archaic British speech or voice-actor impersonation”. Carina's identity says “not an impersonation”; Harry's says “no performed celebrity likeness”. | English and generic voices preserve the user-adopted language and creative boundary. |
| Southern British English | The same brief owns contemporary register but does not specify a southern regional accent. | This was a delegated producer control choice for these probes, rather than an inherited canonical regional fact. Its reason was a consistent contemporary delivery direction without actor imitation. No source text is changed to imply it was user-fixed. |
| Natural close microphone | Carina's identity says “close and unforced”; Harry's says “conversational and slightly breathy”. Neither specifies physical recording equipment. | A producer recording-style instruction, not a claim that a microphone was used or an exact studio condition measured. |
| Pure generic design; no voice reference; timing-only status | [Pre-correction PROJECT snapshot](../images/sources/paper-crane-pre-student-casting-project.md#give-it-back-potter), observed raw SHA256 `84e8319012e6f8c2b7a8a6cd6819e4304210e354d48b238f424e39f60171a9f2`: “measured English dialogue probes”; “invented generic adult voice design for timing probes”; “No provider substitution or real-person voice cloning is adopted.” | This is the historical correspondence epoch, not the now-edited PROJECT or a captured generation-time digest. It supports the old adult-design method without claiming teenage voice suitability. |

The two settings hashes and brief hash also appear in the independent pre-synthesis classification inventory. That historical record supports those snapshot identities; it does not supply an unknown original argv/control/runtime digest. Each utterance's situation and change are the actual screenplay actions beside its mapped line, not a newly invented voice biography.

## Observable CLI and unobserved internals {#tool-and-input-boundary}

The selected local executable was VoxCPM 2.0.3, operation `batch`, model directory revision `32279effe8c19989596f05d353d1447f51d9e915`. Both actual logs identify that model, `enable_denoiser: False` and CPU/bfloat16. The reconstructed commands supplied `--device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10`. No normalization flag, seed, negative prompt, role/system prompt, reference image/audio or motion/control video was supplied. The installed CLI defaults normalization to false and exposes no seed option; this is not a guarantee of deterministic regeneration.

The installed `build_final_text` implementation forms `(CONTROL)UTTERANCE` from the explicit control and each nonblank input line. Its current source correspondence was inspected at `D:/Program Files/VoxCPM/venv/Lib/site-packages/voxcpm/cli.py`, SHA256 `856aabaa3e7c170e1a7d54295e4de1ce9263a987df9c690da0748bd709b8d7f1`. This explains the observable local adapter's composition; no opaque model-internal rewrite or serialized provider request was observed. The original per-call payload digest remains unknown.

The current external installation receipt is `D:/Program Files/VoxCPM/runtime.json`, observed SHA256 `18fa35ad62b4960d97a49b59e530ec77294eb796baebe4c495bb70416ab34e06`. It was later updated with aggregate completion status, so its current digest is not a generation-time digest. It owns local environment/cache locations and installation provenance. No credentials or external voice recording were supplied. Its license field reports Apache-2.0 for the selected runtime/model; no separate historical output-license determination or public redistribution acceptance was recorded.

## Fixed results and real consumer {#fixed-results}

The [retained small measurement receipt](../../analysis/paper-crane-dialogue-measurements.json) is an exact copy of the actual `.cache/audio-probes/measurements.json`, raw SHA256 `722eb16e13e25a14a47f3b6dd6d91dcdbda4c57985e47efa96fe2f55c83d1861`. It is the single full measurement owner for all nine source paths, WAV SHA256s, frames, mono 48 kHz format, untrimmed duration, peak, RMS and zero full-scale counts. The existing [timing interpretation](../../analysis/dialogue-timing.md) owns the chronological 12.00-second total and scene-span limitations. All nine original WAV hashes were rechecked during migration without modifying them.

Output byte sizes in speaker order are Carina 92,204 / 199,724 / 107,564 / 138,284 and Harry 138,284 / 76,844 / 76,844 / 107,564 / 215,084, totaling 1,152,396 bytes. No input voice reference or derivative audio needs restoration for these pure-design requests. Model/runtime dependencies are needed to run a new generation; the fixed original WAVs remain necessary to reproduce the actual measured inputs.

The actual consumer was [the measurement script](../../../scripts/measureSpeechProbes.ts), which reads each original file and calls [measureSpeechProbe](../../../src/measureSpeechProbe.ts), using the installed public Ingest decoder. It completed with exit 0. There is no `audioMix` or playback use of these takes. Status is generated timing candidates, with technical measurements checked but listening, transcript, performance, timbre continuity and final picture synchronization unverified. No candidate was rejected, disposed or promoted to an accepted soundtrack by this migration.

## Availability, restoration and retention {#retention}

All nine originals remain locally retained only under the adopted `.cache/audio-probes` location on this machine. They are required production assets despite the directory's name, not disposable compiler scratch. No verified external archive exists. The input lists and complete measurement facts are preserved in the small Git-eligible records linked above; raw original logs and statuses remain supplementary local evidence. A fresh checkout must obtain the original WAVs from the current local custodian or a subsequently established archive; the repository alone cannot restore missing media bytes.

Restore the exact files to the receipt's speaker-relative paths, then run `Get-FileHash -Algorithm SHA256` for every WAV and compare all nine digests and byte sizes with this record and the measurement receipt. The documented measurement command in [README](../../../README.md) rechecks format, frames and statistics through the real consumer, using a new verification output so the original receipt is preserved. No archive-restore test is claimed because no archive exists. If the only local copy is lost, mark the originals unavailable and the fixed-input timing reproduction broken. Reissuing a prompt creates new candidates and cannot replace the missing exact bytes or inherit their measurements.

Retain these candidates and supporting source snapshots while the authoring handoff or any consumer/review needs them. Before any later disposal of required media, establish an archive, restore it and verify all digests/dependencies under [generation-record retention](../../../.agents/skills/production/generation-records.md). The scoped `/media/generated/` and `/output/` ignore rules govern future generated bytes and exports; they do not delete files, ignore small request/measurement records or prove durable storage.

## Current student-reference compatibility {#student-reference-compatibility}

The later visual-only [PROJECT instruction](../../../PROJECT.md#visual-casting), current raw SHA256 `749f9cbcdb605cfc7f7ced6b41ddc099dd57f453db669461820ce41075943e8a`, adopts the user's around-fifteen appearance and approved Carina student-smirk selection; Harry's student reference is unchanged. Chronological twenty-year-old settings and the reviewed manuscript remain unchanged and are not the new image-age authority. Exact adult controls, payload, original lists, nine WAVs and measured durations above remain historical facts. No audio was regenerated or relabeled; listening, age-fit to revised appearance and soundtrack selection remain pending. The old PROJECT hash/words remain attributable to the retained source snapshot, not retrospectively replaced by this epoch.
