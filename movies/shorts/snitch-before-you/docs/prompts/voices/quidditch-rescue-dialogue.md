# Quidditch rescue dialogue timing requests

## Record boundary and submitted fields {#request-boundary}

This record was reconstructed after three completed local speech calls. It records the three fixed timing candidates, not an accepted soundtrack. The submitted text, exact control strings and speaker/reference choices have one payload owner: [the retained receipt](../../../assets/audio/probes/provenance.json), `takes[0..2]`. Its current file-byte SHA-256 is `cade39df4bd9cd9e50eb64624373ee19213058cbd44dc5a7e3190053a9e30266`, identifying the retained payload plus this migration's backlinks, not a generation-time source capture. Each string was submitted as one CLI argument without a newline. The sections below identify those fields rather than define a second editable copy. The actual model/runtime fields are owned by [the frozen runtime receipt](../../../assets/audio/probes/runtime-source.json), SHA-256 `2fff87bbddcfd03cbb2bfd05511f00640960a181078159e3e514642381b625b3`.

The observed interface was official VoxCPM 2.0.3 `clone`, `openbmb/VoxCPM2` revision `32279effe8c19989596f05d353d1447f51d9e915`. The three producer command calls and exit0 results remain in this chat's tool history; `.cache/quidditch-worker/vox01.log`, `vox02.log` and `vox03.log` retain their actual model/device/output stdout. The shared `D:/Program Files/VoxCPM/production-slots.json` also records the three completed clone calls. No standalone historical argv file or story-source digest was captured with the calls. This reconstruction uses the retained receipt and those observations; it does not fabricate a provider job ID, SDK-internal payload or model prompt rewrite.

The nonsecret command shape below reconstructs those known argument values. Substitute the exact `text` and `control` field of the stated take, the actual external reference path below, and that take's recorded output filename. This is an argv reconstruction, not evidence of deterministic regeneration:

```text
D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe clone --text <takes[index].text> --reference-audio <actual external reference> --control <takes[index].control> --model-path D:/Program Files/VoxCPM/models/VoxCPM2-32279effe8c19989596f05d353d1447f51d9e915 --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10 --output assets/audio/probes/<takes[index].file>
```

The runtime receipt supplies the actual UTF-8, OMP/MKL16, cache and TEMP/TMP environment. Logs report CPU bfloat16. The installed CLI has no seed option; the receipt records no explicit seed. Internal SDK serialization and any internal positive/negative/system framing were not observed. No image, motion video, pose, camera, costume, location or 3D geometry input was supplied to these speech calls.

## Pre-expansion source correspondence checked after generation {#source-correspondence}

The initial source table and take-specific excerpt tables in this record identify the post-generation comparison made before the fourteen-rider expansion. Their raw-file SHA-256 identities and literal excerpts are preserved, not relabelled as the revised scene. The historical source revision read at each generation call remains unknown. A retained earlier screenplay snapshot has SHA-256 `fed77819162100d8c9533ee5e7381687e26d607d00780a6ba1c7f27b3310e8ac`, but no generation receipt binds it to the calls. The local predecessor links below reach the actual preserved comparison edition; their availability depends on retained local history, not Git restoring ignored proof. The separate current construction comparison follows this table.

| Source | File-byte SHA-256 | Used locator |
| --- | --- | --- |
| [Predecessor brief](../../../.cache/scene-completeness/predecessor/docs/instructions/brief.md#approved-story) | `b9c27a60583dc57b667927d30b04c9291704e87cb7fd5da4297f0121ad2560d2` | `approved-story`, paragraph naming all three English lines |
| [Predecessor Carina](../../../.cache/scene-completeness/predecessor/docs/body/settings/carina.md#identity) | `835dbb7722c4226101064b97625dfaa142bce1e3e08e96ceb55eb2e7d50fadee` | `identity`, biography/behavior/voice paragraphs; current source unchanged |
| [Predecessor Harry](../../../.cache/scene-completeness/predecessor/docs/body/settings/harry.md#identity) | `0c12d72c8328578ca229360d37ccda38910708d8442c4af85a5e59cf6a602f56` | `identity`, biography and voice paragraphs; current source unchanged |
| [Predecessor relationship](../../../.cache/scene-completeness/predecessor/docs/body/settings/relationship.md#rivals) | `b13fdeafedbe0d6ab4cdab07362dbbe015ea2a86b9d14e26fbb027babf6e2cce` | `rivals`, equal-standing and guarded-affection paragraphs |
| [Predecessor transferred screenplay](../../../.cache/scene-completeness/predecessor/docs/body/screenplay/snitch-before-you.md#airborne-race) | `ecc8eb3d34316b8fe13352cdd1dcd1e7796566dfb16df508a6fa8d5481d31893` | `airborne-race`; Side by side0–8 and What she missed53–60 |

These are the story facts and performance intentions the request corresponds to. The generator received the quoted receipt fields, not the settings files, screenplay file, its full staging or their content hashes. Shared identity references are unpaired voice references, not time-matched controls; they do not carry a fictional scene event.

## Fourteen-rider construction correspondence {#current-construction-correspondence}

This is a second post-generation comparison, made on 4 November 2026 after the explicit scene-completeness revision. It binds unchanged receipt fields to the actual repaired construction sources below. None of these new hashes is a historical generator input. No request, control, reference, output, measurement or proposed speech placement changed, and no speech was regenerated. The source digests identify complete raw UTF-8 file bytes. Later expression transfer must identify its own delivered bytes separately if whitespace or expression changes them.

| Actual construction source | Raw SHA-256 | Locator and literal support |
| --- | --- | --- |
| [Brief](../../instructions/brief.md#approved-story) | `dbbe6fa39b66967b695765d7c7fd9e5ff539e8abb5ca1fbf4030c4681d1c35aa` | `approved-story`, English-language paragraph: `You lose today, Potter.`, `You almost had it.`, `Then don't fall next time.` remain exact. |
| [Carina](../../body/settings/carina.md#identity) | `835dbb7722c4226101064b97625dfaa142bce1e3e08e96ceb55eb2e7d50fadee` | `identity`, first/third paragraphs: `21-year-old woman`, `contemporary southern British accent`, `The racing taunt projects over flight noise`, `gives "Potter" a small upward inflection`, `after exertion, her short response is breathier and quieter`. |
| [Harry](../../body/settings/harry.md#identity) | `0c12d72c8328578ca229360d37ccda38910708d8442c4af85a5e59cf6a602f56` | `identity`, first/third paragraphs: `21-year-old man`, `mid-to-low English voice is conversational and direct`, `contemporary southern British accent`, `as a quiet recognition rather than a joke at her expense`. |
| [Relationship](../../body/settings/relationship.md#rivals) | `9f9cbcf4124b9a18460dcbf19e7d94eafd4b168475ca3235b811de897570304e` | `rivals`, first/second paragraphs: `familiar adult sporting rivals of equal standing`; `conceals tenderness with impatience`. |
| [Arena](../../body/settings/arena.md#airspace) | `b1751352e7b9b179aa5be7e602c7eeb8236ca1e25768f37b032e72f132e3c849` | `airspace`, sensory paragraph: `Projected short speech is audible between nearby Seekers`; `reduced flight noise permits their arm's-length recovery exchange`. This supplies context, not a sound input to TTS. |
| [Frozen repaired construction screenplay](../../revision/screenplay/snitch-before-you.md#airborne-race) | `7eece2d0ebf1bd15c754e83e5620b0d585d8da2014af470379f241521e5821ff` | `airborne-race`, Side by side0–8: `Wind and vibrating bristles rise over the game sounds.` and `She turns just far enough for him to hear.` Across43–53: `both take a full breath`. What she missed53–60: both ending lines and the glance/room actions, including `She shifts her front hand and leaves him a little more room behind her.` |

For `takes[0].text/control`, the unchanged English taunt and Carina's dry projected southern British register correspond to the current Side by side wind/turn/competitive reach. For `takes[1]`, the exact recognition line and quiet conversational exertion control correspond to Harry's prior sight of the near-catch, settled support and full breath before What she missed. For `takes[2]`, the exact reply, same fictional female reference and lower/breathier guarded-impatience control correspond to Carina's unchanged voice baseline, current relationship resistance, glint glance and rear-room gesture. These literal/source relationships replace no older comparison and prove no audible acting. Background game sounds, anonymous players and Keeper aid were not sent to the original three clone calls; they remain authored scene decisions, not new waveform contents.

## Delivered expression correspondence {#delivered-expression-correspondence}

The actual reviewed expression was transferred on 4 November 2026 through the public byte-preserving comment remover and guarded host. [The transfer receipt](../../analysis/expression-transfer.json), 708 bytes, raw SHA-256 `6f849a01c95aabe19b542381edc880b6a2847cf052b5f85ebdb841c55def45e4`, identifies frozen construction `7eece2d0...`, reviewed annotated working `f0b0af95...` and the exact comment-free delivered bytes. This is a third later source epoch, not another generation call or a changed historical request.

The [actual delivered screenplay](../../body/screenplay/snitch-before-you.md#airborne-race) is 6660 bytes, raw SHA-256 `21d77cc7702612f8e2984bc7ae5a81cfa4cc76679b200a5004103eeaf0671cd2`. Its Side by side0–8 retains all three relevant taunt anchors: `You lose today, Potter.`, `Wind and vibrating bristles rise over the game sounds.` and `She turns just far enough for him to hear.` Across43–53 retains `both take a full breath`; What she missed53–60 retains `You almost had it.`, `Then don't fall next time.` and `She shifts her front hand and leaves him a little more room behind her.` These exact source passages continue to correspond to `takes[0..2].text/control/reference` as explained above.

The five brief/character/relationship/arena source identities in the construction table remain unchanged. Expression clarifies the grip object and recomposes how background activity shares the travelling foreground view; no spoken word, voice intention, actor knowledge, support or final outcome changes. The current delivered-source comparison is explicitly post-generation. No new call, edited waveform, trim, subtitle, mix or picture synchronization follows from it. The frozen and annotated comparison inputs are locally retained dependencies described in the handoff; they are not restored by Git alone.

## Carina challenges Harry during the race {#carina-racing-taunt}

Request fields are `takes[0].text`, `takes[0].control` and the first Carina identity reference in the receipt. The text is exactly `You lose today, Potter.` The actual supplied reference path was `D:/Program Files/VoxCPM/samples/carina-identity-reference.wav`; [the retained project copy](../../../assets/audio/probes/carina-identity-reference.wav) is a later byte-identical availability alias, not the historical argv path. Its generation and exact identity are recorded in [Carina's voice reference](carina-and-harry-voice-references.md#carina-reference).

| Receipt instruction | Source excerpt and transformation |
| --- | --- |
| Exact `text` | Brief `approved-story`: `You lose today, Potter.`; screenplay `airborne-race`, Side by side0–8, CARINA's actual line. No words or punctuation changed. |
| Adult woman, clear southern British English | Carina `identity`: `21-year-old woman`, `clear, dry and precisely articulated`, `contemporary southern British accent`. The request omits age number and body/appearance details. |
| Dry competitive taunt, projected over wind, lift on Potter | Carina `identity`: `The racing taunt projects over flight noise` and `gives "Potter" a small upward inflection`; screenplay: `Wind rasps over vibrating bristles` and `She turns just far enough for Harry to hear.` These become a vocal control; no camera or flight motion is sent. |

One completed clone output is locally retained as `assets/audio/probes/01-carina-taunt.wav`:153,644bytes, SHA-256 `e80f928585e6d78879bd67b067d094547807f388af26736e3036edc782c82c1a`,76,800PCM16 mono frames at48,000Hz,1.60seconds. The observed CLI saved that file with exit0. No retry or edited dialogue take is recorded for this line. Intended placement4.00–5.60seconds is an author timing proposal, not a submitted duration or verified picture/audio alignment.

## Harry recognizes the catch she abandoned {#harry-recognizes-the-lost-catch}

Request fields are `takes[1].text`, `takes[1].control` and Harry's identity reference. The text is exactly `You almost had it.` The actual reference argv path was `D:/Program Files/VoxCPM/samples/harry-identity-reference.wav`; [the project alias](../../../assets/audio/probes/harry-identity-reference.wav) preserves its exact bytes. See [Harry's voice reference](carina-and-harry-voice-references.md#harry-reference).

| Receipt instruction | Source excerpt and transformation |
| --- | --- |
| Exact `text` | Brief `approved-story` and screenplay `airborne-race`, What she missed53–60: `You almost had it.` No textual transformation. |
| Adult man, clear southern British English, conversational | Harry `identity`: `21-year-old man`, `mid-to-low English voice is conversational and direct`, `contemporary southern British accent`. The request supplies broad vocal identity, not visual appearance. |
| Quiet recognition with breath returning after exertion | Harry `identity`: `as a quiet recognition rather than a joke at her expense`; screenplay `airborne-race`, Across43–53: `both take a full breath`, followed by the recovered-flight line. Those scene values become a delivery instruction, not proof of the generated acting. |

One completed output is locally retained as `assets/audio/probes/02-harry-recognition.wav`:122,924bytes, SHA-256 `625185723ea8ab35630b4b059d42d3b11cb7f35f3738a05c4688ee850bfb7982`,61,440PCM16 mono frames at48,000Hz,1.28seconds. CLI exit0 and the saved bytes are observed. No line retry or derivative is recorded. Proposed placement54.00–55.28seconds does not establish audible onset or synchronization.

## Carina deflects concern after the rescue {#carina-guarded-reply}

Request fields are `takes[2].text`, `takes[2].control` and the same actual Carina reference path/hash used by the taunt. The exact text is `Then don't fall next time.` Reuse constrains intended identity; hearing has not established timbre consistency between the results.

| Receipt instruction | Source excerpt and transformation |
| --- | --- |
| Exact `text` | Brief `approved-story` and screenplay `airborne-race`, What she missed53–60: `Then don't fall next time.` Apostrophe and punctuation are retained. |
| Same adult woman and southern British English | Carina `identity`, same source values and same supplied reference bytes as the taunt. |
| Lower volume, breath after exertion, guarded impatience rather than anger | Carina `identity`: `after exertion, her short response is breathier and quieter` and `She masks concern with impatience`; relationship `rivals`: `resists exposing affection`. Screenplay places the response after shared breath, the glance at the prize and making room. The control interprets this as guarded vocal delivery without adding a confession or a new event. |

One completed output is locally retained as `assets/audio/probes/03-carina-reply.wav`:153,644bytes, SHA-256 `0e7dd911f8c02b409ddb26c9429feedd351e554d51d53159020924a263938e9f`,76,800PCM16 mono frames at48,000Hz,1.60seconds. CLI exit0 is recorded; no line retry or edited derivative is recorded. Planned57.00–58.60seconds is not a generation parameter or performed edit.

## Observed use and retained availability {#observed-use}

All three files were consumed by the production's actual [WAVE measurement host](../../../scripts/measureSpeechProbes.ts) through the public Ingest decoder. [The unchanged measurements](../../../assets/audio/probes/measurements.json) record exact bytes, frames, peak, RMS and zero saturated samples; their source facts are not transcript or acting approval. The receipt retains Apache-2.0 software/model-source information without treating it as heard performance or a new output-rights determination.

No trim, resample, retime, normalization, mixing, caption derivative or film inclusion was performed. `src/createProduction.ts` remains an empty scene and `render.config.ts` has no audio mix. These are original timing candidates, not an adopted soundtrack. All three outputs and both required reference aliases are local-only, ignored media with no verified durable archive. [The current handoff](../../analysis/generation-handoff.md#retention-and-restoration) owns exact locators, restoration and loss limits. Do not delete them because a prompt survives; regeneration creates a new candidate.
