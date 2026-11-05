# Three O'Clock invitation dialogues

This record reconstructs seven executed local speech requests after generation. Their purpose was to measure candidate English dialogue for the invitation scene, not to accept a voice or make a soundtrack. The exact submitted words and controls are owned by [synthesis-commands.json](../../../references/audio/synthesis-commands.json), SHA256 `5d32d7f5326cb0365356485aac692f086f19c743d13f79738d901ea82632435b`; the seven meaningful sections below map its zero-based entries to actual creative sources and output identities. All seven observed exit codes are 0. No remote request/job ID was returned. Original source-file digests at submission, execution timestamps and a full original command transcript were not captured and remain unknown.

The later [current source correspondence](#current-source-correspondence) identifies the completed scene-completeness replacement independently of the first retrospective comparison below. It is a later check of unchanged requests and words, never a new generation input.

## Request and source identities {#request-and-sources}

The [reconstruction and artifact inventory](../../../references/audio/generation-records.json) owns retained input/output locators, byte sizes, digests, format facts, reconstructed CLI arguments and availability. [The runtime snapshot](../../../references/audio/voxcpm-runtime.json), SHA256 `2fff87bbddcfd03cbb2bfd05511f00640960a181078159e3e514642381b625b3`, owns common fields: official `voxcpm==2.0.3` `clone`, VoxCPM2 model revision `32279effe8c19989596f05d353d1447f51d9e915`, CPU, CFG 2, ten inference steps, optimize/denoiser disabled, UTF-8 and thread/cache environment. This installed interface supplies no seed option. No negative, system or role prompt, crop, trim, retiming or time-matched control was submitted. A CLI reconstruction is not an observed internal provider payload. Generated invented reference voices are [separate input records](carina-and-harry-voice-references.md).

The following hashes are raw complete-file SHA256 values checked retrospectively during the first generation-record migration, not historical launch snapshots. A later user-requested scene-completeness cycle replaces the place and scene; the exact earlier promoted/frozen/profile files are now retained under `.cache/scene-completeness/predecessor`. The table links those retained editions where needed. A later source correspondence will be appended separately rather than rewriting these first observed identities or claiming newer text was sent to the old generator.

| Source | Current retained digest and exact locator |
| --- | --- |
| [Predecessor promoted scene](../../../.cache/scene-completeness/predecessor/docs/body/screenplay/three-oclock.md#courtyard-invitation) | `a721acc3c2d872f02b85d56a26a2181e3ebeba938873423bfb50bc5eb26e265d`; H2 `courtyard-invitation`, the time span and speaker identified in each request below. |
| [Predecessor frozen construction](../../../.cache/scene-completeness/predecessor/docs/revision/screenplay/three-oclock.md#courtyard-invitation) | `7bf5413f4c7ad265676bcfa2b7f463a2c80b86c11b7334bca31a6427334b282a`; the same H2 and seven utterances. It is a retained local comparison input, ignored by the narrative workflow and not supplied by a fresh Git checkout. |
| [Historical Carina voice baseline](sources/carina-pre-uniform-baseline.md#carina) | `87919dad5420fb3e7eeb13337cbd481881248fdf5a423063cb4a23c5079d1040`; paragraph 2: "Her voice is youthful, female, middle-to-upper pitched, clear and lightly bright, with contemporary British pronunciation." The same paragraph states "Rehearsal commands have clipped ends; direct vulnerability lowers her volume and slows the last few words." |
| [Historical Harry voice baseline](sources/harry-pre-uniform-baseline.md#harry) | `d99c107edbd5b4c97e57ff20d83e9a5743a4580f6d20167c73285a999bfd8e73`; paragraph 1: "His youthful male voice is middle pitched, softly rough, lightly resonant and conversational, with ordinary contemporary British pronunciation, unhurried replies and no imitated film actor." |
| [Predecessor operating scope](../../../.cache/scene-completeness/predecessor/PROJECT.md#three-oclock) | `073c37b3279bfd33273bfa7629d6279d60843100da8d649970bb11305b787716`; paragraph beginning "The user authorized a fresh isolated VoxCPM setup" owns selected local synthesis, candidate timing and unverified listening. This later-observation edition is not misrepresented as the generation-time edition. |

Each utterance below matches both retained screenplay editions exactly. The present scene's expressive rewrite changed surrounding directions, not these words. The source relationships are retrospective correspondence; this record does not claim the generator read an entire settings file or that a source hash was sent through the CLI. Youthful British speaker descriptions follow the settings; the specific acting controls below are delegated production interpretations where named, not additional canonical facts. The earlier voice-source comparison used the unchanged about-sixteen profiles. The later [user image-casting correction](../../../PROJECT.md#current-visual-casting) independently requests approximately-fifteen appearance; it was not the source of these old voice requests. Adult-designed anchors and takes remain unheard, with teenage visual-age fit and soundtrack acceptance pending.

## Abandoned opening rehearsal {#rehearsed-opening}

Payload entry 0 requests Carina, exact `text` "Potter. On Saturday..." and exact `control` "A youthful British female voice starts a firm rehearsal then trails off uncertainly." In `courtyard-invitation`, 0–13 seconds, Carina speaks that fragment to the empty bench and stops before returning to try again. The utterance is the literal inherited field; the voice identity maps to Carina's baseline above. Firm onset and uncertain trailing-off interpret the fragment and abandoned approach rather than quote a prescribed acoustic performance. No actor imitation is requested.

Attempt `rehearsed-opening` uses `carina-reference`; original output is `references/audio/probes/01-carina-saturday.wav`, artifact `rehearsed-opening` in the inventory, 215,084 bytes, SHA256 `7a1c6bb6bb104792822111f68b9275e135d334b71179b35377f9d421e3c11770`, 107,520 frames at 48 kHz, 2.24 seconds. Exit 0 is retained in the payload receipt; the ignored raw save log is supplementary only.

## The rehearsed command {#rehearsed-command}

Payload entry 1 requests Carina, exact `text` "Saturday. Three. Don't be late." and exact `control` "A youthful British female voice rehearses short clipped instructions with clear consonants, without shouting." The scene's 0–13 seconds gives this second approach and its extended note; "Her elbow droops." then ends the attempt. Carina's baseline explicitly supplies clipped rehearsal ends and intelligible consonants rather than shouting. The instruction applies that baseline to this complete line; no new threat or demand is added to the relationship.

Attempt `rehearsed-command` uses `carina-reference`; original output is `references/audio/probes/02-carina-command.wav`, 291,884 bytes, SHA256 `287915968146ac6a7a4471a887fe223b2be420def53c777751ccf05c4d450d58`, 145,920 frames, 3.04 seconds. The inventory and payload receipt identify the same file and exit 0.

## Her honest invitation {#honest-invitation}

Payload entry 2 requests Carina, exact `text` "I just wanted to go with you." and exact `control` "A youthful British female voice speaks a quiet vulnerable invitation, slowly and clearly." The scene's 13–25 seconds supplies that line with the literal `(quieter)` cue, after "her shoulders less square" and before Harry's reply. Lower volume and slower vulnerability are also explicit in Carina's baseline; the control preserves this meaning rather than introducing another event or timbre guarantee.

Attempt `honest-invitation` uses `carina-reference`; original output is `references/audio/probes/03-carina-invitation.wav`, 215,084 bytes, SHA256 `c7f87bcd969a5218776c99df1eb0d749b2e69b3bbcb55b66b31f770329952be7`, 107,520 frames, 2.24 seconds; exit 0.

## Harry accepts {#harry-accepts}

Payload entry 3 requests Harry, exact `text` "All right." and exact `control` "A youthful British male voice accepts warmly and conversationally, without teasing." The scene's 13–25 seconds places Harry's literal reply directly after Carina's audible invitation and before her arm freezes. His baseline supplies conversational British voice and unhurried replies; its relationship paragraph permits him to accept or refuse without authority over her. Warm acceptance without teasing is the producer's performance choice within that voluntary reply, not a claimed literal source quotation or a verified tone.

Attempt `harry-accepts` uses `harry-reference`; original output is `references/audio/probes/04-harry-acceptance.wav`, 76,844 bytes, SHA256 `64faf5e63ce0fa8d05c5b9f73aacd5a1bb82669141b2e4e292911377a4f8b593`, 38,400 frames, 0.80 seconds; exit 0.

## Caught rehearsing {#caught-rehearsing}

Payload entry 4 requests Carina, exact `text` "How long have you been there?" and exact `control` "A youthful British female voice asks a brief startled question, clearly and without shouting." In 25–36 seconds she hides the note and turns after hearing Harry before speaking that exact question. The voice identity and clear consonants/no-shout boundary come from her baseline. Startled delivery interprets the discovered rehearsal and adjacent freeze/concealment; the source does not prescribe that adjective or prove the generated emotion.

Attempt `caught-rehearsing` uses `carina-reference`; original output is `references/audio/probes/05-carina-discovered.wav`, 122,924 bytes, SHA256 `3c1ec56ef72afeae7141ed592620687090b3cb84990ec2a97356b8f116c252be`, 61,440 frames, 1.28 seconds; exit 0.

## The appointment time {#appointment-time}

Payload entry 5 requests Carina, exact `text` "Three o'clock." and exact `control` "A youthful British female voice speaks briefly with recovered composure and restrained warmth." The 48–60-second source places the line after "only then does she release it" completes voluntary transfer. This is the dialogue's exact time rather than the note's longer written inscription. Recovered composure and restrained warmth are the producer's interpretation of her successful final handoff after failed attempts, not new canonical facts or an observed acoustic result.

Attempt `appointment-time` uses `carina-reference`; original output is `references/audio/probes/06-carina-time.wav`, 276,524 bytes, SHA256 `fe42c608fe35cb497605dc586631d228e06774550681268dbd3e3b934ce40869`, 138,240 frames, 2.88 seconds; exit 0. The long untrimmed duration is measured, not silently shortened to the two-word length.

## He heard her {#heard-you}

Payload entry 6 requests Harry, exact `text` "I heard." and exact `control` "A youthful British male voice gives a dry affectionate reply, softly and conversationally." In 48–60 seconds she turns west and leaves; he touches his forehead, speaks this exact reply and looks down at the note as his smile grows. His baseline supplies a conversational voice; dry affection and soft delivery are producer choices interpreting this closing relationship and action. They are intended performance, not verified listening observations or an added romantic commitment.

Attempt `heard-you` uses `harry-reference`; original output is `references/audio/probes/07-harry-heard.wav`, 215,084 bytes, SHA256 `75cff8e7f5be0154c93791f675e9f769e2c62f653a8bd17aa8723afcf0554ca8`, 107,520 frames, 2.24 seconds; exit 0.

## Actual use, retention and limits {#use-and-retention}

All seven original results are mono 48 kHz timing candidates, with zero full-scale samples and finite decoded samples in the [single measurement owner](../../../references/audio/dialogue-measurements.json). They total 14.72 seconds without trims, retiming or regeneration. [Timing analysis](../../analysis/dialogue-timing.md) compares them with provisional intervals; the actual consumer was the shared public-decoder measurement host, not `src`, a soundtrack or the film renderer. No auditory inspection, transcript, pronunciation, youthful fit, timbre continuity or picture synchronization has been accepted.

The nine required input/output WAVs are locally retained at the inventory's exact paths, selectively ignored and unchanged. No verified durable archive or restore test exists. A fresh checkout must obtain these originals from the production owner and verify all digests before measuring or adopting them; the external shared anchors alone do not recover the seven dialogue results. Keep the bytes while this timing/review chain depends on them. New synthesis is another candidate, not a byte-identical restoration. [Current handoff answers](../../analysis/generation-handoff.md) distinguish manual source/request inspection from native narrative coverage and the preserved closed-construction diagnostic.

## Earlier scene-completeness source correspondence {#current-source-correspondence}

This is the historical post-replacement comparison after actual construction/expression closure and exact transfer, before the later canonical student/uniform alignment. It does not change the original seven request fields, controls, output bytes, first retrospective source identities or unknown launch hashes/timestamps. The two voice-baseline aliases above retain exact historical bytes; neutral setup choices and all producer acting interpretations retain their earlier limits. No request was resubmitted, trimmed or retimed. The former promoted scene and brief now remain under `.cache/canonical-alignment/predecessor/docs`, at the same relative paths and raw hashes listed below. Those rows identify that observation epoch, not the changed current bodies.

| Actual later source | Raw SHA256 and correspondence |
| --- | --- |
| [Promoted scene at that observation](../../../.cache/canonical-alignment/predecessor/docs/body/screenplay/three-oclock.md#courtyard-invitation) | `e6573c8b01e79de3633584f7e6a97549d4d64b3c5604aaca628b1fe7f6a76c84`; same H2 and five provisional intervals, with five bound unspoken notes retaining exact physical execution. |
| [Current frozen construction](../../revision/screenplay/three-oclock.md#courtyard-invitation) | `8311399a3850b43494cdb57a8d0c0ee785df2ff8cc2cf14cf6108c98633def70`; exact new closed construction. Locally retained ignored workflow input, separate from the predecessor frozen edition. |
| [Current reviewed working file](../../naturalness/screenplay/three-oclock.md#courtyard-invitation) | `6c02da63ebdec46d08812280ea510b66f50d918606fb6e0adbf8b5423b1375bb`; current evidence-bearing expression. The public-helper report verifies promoted equality after HTML-comment removal; plain Markdown staging notes remain. |
| [Operating scope at that pre-student-casting observation](../images/sources/three-oclock-pre-student-casting-project.md#three-oclock) | `f29acb24afb0f0a511206cecaeb88c33410cd7d6715f654645a14cd50ef6b355`; exact former `PROJECT.md` bytes for the five-record replacement, closed individual writing gates, exact promotion and retained history. This historical alias is source data whose original relative links resolve from the production root. The current visual-casting H2 was added later and is not a historical generation input. |
| [Brief at that observation](../../../.cache/canonical-alignment/predecessor/docs/instructions/brief.md#motion) | `755e720e17cd98baf95f856325f2b1cc89ed6b30f3e24990c8ea0c0c7872f863`; "The exact same seven dialogue utterances, note interaction and ending remain fixed in this replacement scope." |

Each row below is a literal performed-word match against the current promoted and frozen scene at H2 `courtyard-invitation`; the original source/control section remains its single request owner. Time windows are screenplay estimates, not WAV placement in an implemented edit.

| Payload entry / request section | Current speaker and window | Exact literal current speech |
| --- | --- | --- |
| 0 / [opening](#rehearsed-opening) | Carina, 0–13 seconds | "Potter. On Saturday..." |
| 1 / [command](#rehearsed-command) | Carina, 0–13 seconds | "Saturday. Three. Don't be late." |
| 2 / [invitation](#honest-invitation) | Carina, 13–25 seconds, `(quieter)` | "I just wanted to go with you." |
| 3 / [acceptance](#harry-accepts) | Harry, 13–25 seconds | "All right." |
| 4 / [question](#caught-rehearsing) | Carina, 25–36 seconds | "How long have you been there?" |
| 5 / [time](#appointment-time) | Carina, 48–60 seconds | "Three o'clock." |
| 6 / [reply](#heard-you) | Harry, 48–60 seconds | "I heard." |

Current literal neighboring support is still "His hand remains open in the space she has left" and "keeps hold until his fingers close; only then does she release it." These preserve withdrawal and voluntary completed receipt behind the unchanged performance interpretations. The new quiet off-route place, focused bench and bound foot/knee/hip conditions alter no utterance or voice identity. They create no request for footsteps, birds, contact Foley, image, model or video. Those sounds and motion remain authored but unmade. [Byte retention checks](../../analysis/media-retention-check.json) identify all nine original WAVs and two shared PNG dependencies; [handoff](../../analysis/generation-handoff.md) explains local-only restoration and the unverified youthful fit/listening boundary.
