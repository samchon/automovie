# Planned Seedance 2.5 handoff contract

Carried on 2026-11-05 KST from the sibling production record `movies/shorts/look-at-me-duel/docs/research/seedance-2-5-handoff-contract.md` (raw SHA-256 `26032fc54c082e153c1e285e44f21c5d6f6260c4d88cdda7d6a354810998a07c`, 3223 bytes, working tree of the `automovie@malfoy` checkout at `a955b121b22d9f8fec59453a73104aa29ebd50f1`). That record was observed the same day from the official BytePlus pages linked below. This production did not reopen those pages: the prompt-preparation commission excluded downloads and external calls. The values are therefore a carried observation, not a fresh one, and must be rechecked against the current official pages before any submission. There is no authenticated submission, paid call, generated take or observed receiver compatibility.

## Adopted reference operation

Plan `dreamina-seedance-2-5-260628`, `omni_reference_task_type: reference`, one `reference_video`, `ratio: 16:9` and the actual clip duration in whole seconds. This is semantic reference, without exact-frame guarantees. Future upload remains `{{SOURCE_CLIP_PUBLIC_URL}}`. [Official model reference example](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

Editing intent instead requires adaptive aspect and duration -1. Keep this reference operation separate from editing, extension and strict first/last-frame roles. [Task constraints](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

## Input budget

Adopt 4–30 seconds per reference clip. Count continuity inputs within 10 videos / 30 seconds aggregate. Per video: ≤ 200 MB; MP4/MOV; H.264/H.265; 24–60 fps; each side 300–6000 px; aspect 0.4–2.5; 407696–8295044 pixels. This production's 1280 × 720 raster (921600 pixels, aspect 1.78) at 30 fps meets these format limits; actual segment files still require probing. Seedance 2.0 compatibility is not assumed. [Official input table](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

The sibling record retained this excerpt from that table: “up to 10 reference videos with a total duration of no more than 30 s.”

The carried record states no maximum generated-output duration and no output frame rate. Sibling productions planned reference-mode durations from 9 to 24 seconds, which is planning practice, not documented support. Treat the output duration cap and output timing rule as unknown until the official page is reread; the 30-second input allowance is not an output allowance.

## Reference roles and planned sound

The whole deterministic render and its segments remain independent retained outputs. The supplied video carries actor mapping, contact, support, timing and camera. No appearance image is attached: no reference image of A, B or the referee exists, and the account's face-input permission is unverified. No audio reference is attached. Native generated audio is enabled: the deterministic film is silent, and the video model makes all of its sound.

The sibling record cites the prompt guide's description of coarse rendering input: “Uses coarse-grained or fine-grained 3D clay-model videos as motion references”. This is documented support, not an observed result from this production's polygon render. Prompts map each named performer and preserve the physical causes while stating the intended visual finish. Keep English prompt text within the guide's recommended 1000 words; an undocumented hard character cap remains unknown. [Official prompting guide](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5-prompt-guide).

## Submission boundary

The documented asynchronous API creates a task at `POST /contents/generations/tasks`, then polls its returned ID. Authentication, account/model activation, source upload and paid execution remain outside the prompt-preparation commission. Save exact text and planned JSON beside the segment's provenance; a template is not a submitted job. [Official generation tutorial](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/video-generation-tutorial).
