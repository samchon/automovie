# Research routes

The primary sources behind shipped instructions, with what each supports and where it stops. Read the original before adopting an instruction from it: a source's existence, or another medium's success, does not establish an improvement here. Observations come from the production's own source, motion, audio and delivery records, and a tool's failure stays with the package that owns the tool.

- [Prompting](#prompting)
- [Story and editing](#story-and-editing)
- [Performance and staging](#performance-and-staging)
- [Images and forms](#images-and-forms)
- [Video](#video)
- [Sound and delivery](#sound-and-delivery)

## Prompting

| Source | Supports | Limit |
| --- | --- | --- |
| [Anthropic: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | Clear instructions with their reasons, saying what to do, examples, calm wording | General; no film-quality acceptance |
| [Anthropic: Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) | Effort, unattended runs and progress updates for the current model | Changes with each model; verify on the actual task |
| [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | Concise pages, a `SKILL.md` that routes, references one level deep, tables of contents, evaluation before writing | Written for Claude's skill loader; productions find skills through `AGENTS.md` |
| [SkillsBench](https://arxiv.org/html/2602.12670), [IFScale](https://arxiv.org/abs/2507.11538) | Few compact skills outperform many detailed ones; instructions are dropped as their number grows | Benchmarks, not this product's tasks |

## Story and editing

| Source | Supports | Limit |
| --- | --- | --- |
| [AFTRS: Screenwriting](https://medialab.aftrs.edu.au/wp-content/uploads/2021/07/AFTRS16_Screenwriting.pdf) | Resource-aware short films, characters, dialogue, rewriting and the handoff to production | Its duration and cast suggestions are not limits |
| [Bordwell on Hitchcock's bomb](https://www.davidbordwell.net/blog/2013/11/29/hitchcock-lessing-and-the-bomb-under-the-table/), [McKee: do your scenes turn](https://mckeestory.com/do-your-scenes-turn/) | What the audience knows before, with or after a character; a scene's change of value | Craft teaching; a twist or an observational scene may do otherwise |
| Bordwell and Thompson, *Film Art*, continuity editing | The axis of action, eyeline matches, cutting on action, the change a cut needs | Classical norms; a deliberate jump cut stays valid |
| Walter Murch, *In the Blink of an Eye* | Emotion, story and rhythm before spatial continuity at a cut | One editor's priority, not a law |
| [ScreenSkills: Script supervisor](https://www.screenskills.com/job-profiles/browse/film-and-tv-drama/technical/script-supervisor-film-and-tv-drama/) | Breakdown, timing, eyelines and prop continuity across takes | A role description, not a document template |

## Performance and staging

| Source | Supports | Limit |
| --- | --- | --- |
| [DGA: Setting background](https://www.dga.org/the-guild/councils/west/western-adupm-council/committees-of-the-adupm-west/standing-ad-upm-committees/first-ad-committee/setting-background) | Background movers with purpose and destination, crossing behind the action, quiet at a focal moment | Live-set practice, not a measured target |
| [RED: camera panning speed](https://www.reddigitalcinema.com/red-101/camera-panning-speed) | Judder from pan speed at a frame rate and shutter | A rule of thumb for 24 fps and a 180-degree shutter |

## Images and forms

| Source | Supports | Limit |
| --- | --- | --- |
| [Runway: Gen-4 references](https://help.runwayml.com/hc/en-us/articles/40042718905875-Gen-4-Image-References-Guide) | Even light and a neutral expression in a character reference | One vendor |
| [FreqEdit](https://arxiv.org/abs/2512.01755) | Detail lost across repeated image edits | Editing benchmarks, not canon sets |
| [LooseControl](https://arxiv.org/html/2312.03079v1) | Why depth from boxes makes boxy objects, and a looser condition | A research method hosted models do not expose |
| [Unity humanoid avatar](https://docs.unity.com/en-us/engine/current/manual/assets-and-media/asset-types/models/importing/configuringthe-avatar), [Unreal retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine), [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy) | The rest pose a skeleton expects; images for rigged bodies | The A-pose's shoulder benefit is claimed only in vendor blogs |

## Video

| Source | Supports | Limit |
| --- | --- | --- |
| [Google Cloud: Veo best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice) | An unchanged character description in every prompt; motion only beside a source image; one event per shot | Veo's own speech marking |
| [BytePlus: Seedance 2.5 prompt guide](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md) | Reference images per subject, and a clay render as a reference video | One model |
| [Luma: Ray 3.2 video to video](https://lumalabs.ai/learning-center/articles/ray-3-2-video-to-video) | Separate motion and structure adherence, shaded rather than flat sources, prompt enhancement off | One vendor's scales |
| [fal: From clay render to action short](https://blog.fal.ai/from-clay-3d-render-to-a-real-action-short-a-3d-to-ai-pipeline-with-total-control/) | Takes per shot, key elements in the first frame, framing repaired in the 3D camera | One production with a person selecting |
| [LTX: Layout to Render](https://docs.ltx.io/open-source-model/vfx-post-production/layout-to-render.md), [IC-LoRA](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra.md) | A gray layout finished from a restyled first frame; adapter strength and masks | An open model's adapter contract |
| [VACE user guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [Vertex: extend a Veo video](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate) | Chaining requests from a chosen frame, extension joined to its input, takes drifting at their end | One open model and one hosted model |
| [DiffusionRenderer](https://arxiv.org/abs/2501.18590), [Cosmos-Transfer1](https://arxiv.org/abs/2503.14492) | Rendering from geometry and material buffers; weighting channels over frames and regions | Research models; material buffers need materials coarse forms lack |

## Sound and delivery

| Source | Supports | Limit |
| --- | --- | --- |
| [OpenBMB: VoxCPM](https://github.com/OpenBMB/VoxCPM) | Local speech generation from fixed recordings | A model load does not establish usable speech |
| [Netflix timed text style guides](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977), [W3C WebVTT](https://www.w3.org/TR/webvtt1/) | Caption length, reading speed, timing at cuts, captions for viewers who cannot hear | One distributor's values |
| [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html) | Trimming, rebasing, resampling and retiming | An encoder's success proves no synchronization |
| [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4), [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation) | Separating dialogue, music and effects stems from a film mix, effects being the hardest | Benchmarks and one vendor; test on the production's own takes |
| [MMAudio](https://github.com/hkchengrex/MMAudio) | Video-to-audio effects generated on clips of a few seconds | Trained on short clips; weights non-commercial |
| [OpenTimelineIO time ranges](https://opentimelineio.readthedocs.io/en/latest/tutorials/time-ranges.html) | A clip's used range against its available media; handles for transitions | A format, not a required file |
| [YouTube upload encoding](https://support.google.com/youtube/answer/1722171) | Tagged color, progressive scan and audio sample rate in a delivered file | One platform's values |
