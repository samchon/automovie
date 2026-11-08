# Planned Seedance 2.5 handoff contract

Observed on 2026-11-05 KST from the official BytePlus pages below. This record supports planned requests only. There is no authenticated submission, paid call, generated take or observed receiver compatibility.

## Adopted reference operation

Plan `dreamina-seedance-2-5-260628`, `omni_reference_task_type: reference`, one `reference_video`,9:16 and the actual clip duration. This is semantic reference, without exact-frame guarantees. Future upload remains `{{SOURCE_CLIP_PUBLIC_URL}}`. [Official model reference example](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

Editing intent instead requires adaptive aspect and duration -1. Keep this reference operation separate from editing, extension and strict first/last-frame roles. [Task constraints](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

## Input budget

Adopt4–30seconds per clip. Count continuity inputs within10 videos/30seconds aggregate. Per video:≤200MB;MP4/MOV;H.264/H.265;24–60fps;each side300–6000px;aspect0.4–2.5;407696–8295044pixels.720×1280 at24fps meets these format limits; actual files still require probing. Seedance2.0 compatibility is not assumed. [Official input table](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5).

Retained original excerpt from that table: “up to 10 reference videos with a total duration of no more than 30 s.”

## Reference roles and planned sound

The whole deterministic hint and actual causal segments remain independent retained outputs. The supplied video carries actor mapping, contact, support, timing and camera. Optional shared images carry static identity/costume only; the default payload includes none because this account's external face-input permission has not been verified. No audio reference is attached. The actual hint is silent with English dialogue captions; native generated audio is disabled in the default planned template. Candidate VoxCPM bytes and their4/4 technical ASR comparison are retained separately, with listening, acting and teenage-voice fit unaccepted.

The prompt guide describes the coarse rendering input as: “Uses coarse-grained or fine-grained 3D clay-model videos as motion references”. This is documented support, not an observed result from our video. Prompts will map each named actor and preserve the story's physical causes while stating the intended visual finish. Keep English prompt text within the guide's recommended1000words; an undocumented hard character cap remains unknown. [Official prompting guide, motion reference and clay-model rendering](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5-prompt-guide).

## Submission boundary

The documented asynchronous API creates a task at `POST /contents/generations/tasks`, then polls its returned ID. Authentication, account/model activation, source upload and a future paid execution remain outside this completed motion-hint commission. Save exact text and planned JSON beside the actual segment's provenance; a template is not a submitted job. [Official generation tutorial](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/video-generation-tutorial).
