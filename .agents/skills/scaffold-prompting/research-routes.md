# Research routes

The primary sources behind shipped instructions, with what each supports and where it stops. Read the original before adopting an instruction from it: a source's existence, or another medium's success, does not establish an improvement here. Observations come from the production's own source, motion, audio and delivery records, and a tool's failure stays with the package that owns the tool.

## Prompting

[Anthropic: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) supports clear instructions with their reasons, saying what to do, examples and calm wording. It is general and gives no film-quality acceptance.

[Anthropic: Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) supports effort, unattended runs and progress updates for the current model. It changes with each model, so verify on the actual task.

[Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) supports concise pages, a `SKILL.md` that routes, references one level deep, tables of contents and evaluation before writing. It is written for Claude's skill loader, while productions find skills through `AGENTS.md`.

[SkillsBench](https://arxiv.org/html/2602.12670) and [IFScale](https://arxiv.org/abs/2507.11538) support that few compact skills outperform many detailed ones, and that instructions are dropped as their number grows. They are benchmarks, not this product's tasks.

## Story and editing

[AFTRS: Screenwriting](https://medialab.aftrs.edu.au/wp-content/uploads/2021/07/AFTRS16_Screenwriting.pdf) supports resource-aware short films, characters, dialogue, rewriting and the handoff to production. Its duration and cast suggestions are not limits.

[Bordwell on Hitchcock's bomb](https://www.davidbordwell.net/blog/2013/11/29/hitchcock-lessing-and-the-bomb-under-the-table/) and [McKee: do your scenes turn](https://mckeestory.com/do-your-scenes-turn/) support what the audience knows before, with or after a character, and a scene's change of value. They are craft teaching, and a twist or an observational scene may do otherwise.

Bordwell and Thompson, *Film Art*, on continuity editing, supports the axis of action, eyeline matches, cutting on action and the change a cut needs. These are classical norms, and a deliberate jump cut stays valid.

Walter Murch, *In the Blink of an Eye*, supports emotion, story and rhythm before spatial continuity at a cut. It is one editor's priority, not a law.

[ScreenSkills: Script supervisor](https://www.screenskills.com/job-profiles/browse/film-and-tv-drama/technical/script-supervisor-film-and-tv-drama/) supports breakdown, timing, eyelines and prop continuity across takes. It is a role description, not a document template.

## Performance and staging

[DGA: Setting background](https://www.dga.org/the-guild/councils/west/western-adupm-council/committees-of-the-adupm-west/standing-ad-upm-committees/first-ad-committee/setting-background) supports background movers with purpose and destination, crossing behind the action, and quiet at a focal moment. It is live-set practice, not a measured target.

[RED: camera panning speed](https://www.reddigitalcinema.com/red-101/camera-panning-speed) supports judder from pan speed at a frame rate and shutter. It is a rule of thumb for 24 fps and a 180-degree shutter.

## Images and forms

[Runway: Gen-4 references](https://help.runwayml.com/hc/en-us/articles/40042718905875-Gen-4-Image-References-Guide) supports even light and a neutral expression in a character reference. It is one vendor.

[FreqEdit](https://arxiv.org/abs/2512.01755) supports detail lost across repeated image edits. It covers editing benchmarks, not canon sets.

[LooseControl](https://arxiv.org/html/2312.03079v1) supports why depth from boxes makes boxy objects, and a looser condition. It is a research method hosted models do not expose.

[Unity humanoid avatar](https://docs.unity.com/en-us/engine/current/manual/assets-and-media/asset-types/models/importing/configuringthe-avatar), [Unreal retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine) and [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy) support the rest pose a skeleton expects and images for rigged bodies. The A-pose's shoulder benefit is claimed only in vendor blogs.

[SDXL's model card](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) and [Stable Diffusion 3.5's card](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) distinguish checkpoint families and licenses. The official [3.5 ControlNets](https://huggingface.co/stabilityai/stable-diffusion-3.5-controlnets) target Large with Canny, depth and blur; they do not establish compatibility with other bases.

[ControlNet](https://huggingface.co/docs/diffusers/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/en/using-diffusers/ip_adapter) supply structural and reference conditioning to compatible generators. Their presence does not establish exact pixel preservation or the rights of every component's weights.

[FLUX 3 Image](https://docs.bfl.ml/flux_3/flux3_image_overview.md) describes multi-reference and box-guided editing; [Klein's guide](https://docs.bfl.ml/flux_3/flux3_image_klein.md) requires prompt expansion. Retain exposed expansions, and record the observation limit where a service hides them.

[Seedream's image API](https://docs.byteplus.com/en/docs/modelark/image-generation-api) distinguishes sequential sets from other editing features by version. [Midjourney](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) likewise changes its subject-reference route by version; a [style reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) does not copy identity.

## Video

[Google Cloud: Veo best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice) supports an unchanged character description in every prompt, motion only beside a source image, and one event per shot. Its speech marking is Veo's own.

[BytePlus: Seedance 2.5 prompt guide](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md) supports reference images per subject, and a clay render as a reference video. It is one model.

[Luma: Ray 3.2 video to video](https://lumalabs.ai/learning-center/articles/ray-3-2-video-to-video) supports separate motion and structure adherence, shaded rather than flat sources, and prompt enhancement off. Its scales are one vendor's.

[fal: From clay render to action short](https://blog.fal.ai/from-clay-3d-render-to-a-real-action-short-a-3d-to-ai-pipeline-with-total-control/) supports takes per shot, key elements in the first frame, and framing repaired in the 3D camera. It is one production with a person selecting.

[LTX: Layout to Render](https://docs.ltx.io/open-source-model/vfx-post-production/layout-to-render.md) and [IC-LoRA](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra.md) support a gray layout finished from a restyled first frame, and adapter strength and masks. They are an open model's adapter contract.

The [VACE user guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md) and [Vertex: extend a Veo video](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate) support chaining requests from a chosen frame, extension joined to its input, and takes drifting at their end. They are one open model and one hosted model.

[DiffusionRenderer](https://arxiv.org/abs/2501.18590) and [Cosmos-Transfer1](https://arxiv.org/abs/2503.14492) support rendering from geometry and material buffers, and weighting channels over frames and regions. They are research models, and material buffers need materials coarse forms lack.

## Sound and delivery

[OpenBMB: VoxCPM](https://github.com/OpenBMB/VoxCPM) supports reference conditioning and speech generation. Its languages and controls vary by checkpoint.

The [Netflix timed text style guides](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977) and [W3C WebVTT](https://www.w3.org/TR/webvtt1/) support caption length, reading speed, timing at cuts, and captions for viewers who cannot hear. Their values are one distributor's.

[FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html) supports trimming, rebasing, resampling and retiming. An encoder's success proves no synchronization.

The [Sound Demixing Challenge 2023](https://arxiv.org/html/2308.06981v4) and [AudioShake](https://www.audioshake.ai/products/dialogue-music-effects-separation) support separating dialogue, music and effects stems from a film mix, effects being the hardest. They are benchmarks and one vendor, so test on the production's own takes.

[MMAudio](https://github.com/hkchengrex/MMAudio) supports video-to-audio effects generated on clips of a few seconds. It is trained on short clips, and its weights are non-commercial.

[OpenTimelineIO time ranges](https://opentimelineio.readthedocs.io/en/latest/tutorials/time-ranges.html) supports a clip's used range against its available media, and handles for transitions. It is a format, not a required file.

[YouTube upload encoding](https://support.google.com/youtube/answer/1722171) supports tagged color, progressive scan and audio sample rate in a delivered file. Its values are one platform's.

### Audio generation

[Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [CosyVoice](https://github.com/QwenAudio/CosyVoice) and [OpenVoice](https://github.com/myshell-ai/OpenVoice) distinguish reference synthesis, voice design and conversion. Checkpoint and language determine which inputs and controls exist.

[MOSS-TTS](https://github.com/OpenMOSS/MOSS-TTS) and [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) cover long speech and voice adaptation. [Fish Drama 3](https://huggingface.co/fishaudio/drama-3), [Higgs TTS 3](https://huggingface.co/bosonai/higgs-tts-3-4b) and [IndexTTS](https://github.com/index-tts/index-tts) add expressive controls with release-specific terms.

[F5-TTS](https://github.com/SWivid/F5-TTS) and [XTTS-v2](https://huggingface.co/coqui/XTTS-v2) show why code licenses do not establish weight rights. [Chatterbox](https://github.com/resemble-ai/chatterbox) and [VibeVoice](https://github.com/microsoft/VibeVoice) show why maintenance and component availability affect adoption.

[Stable Audio 3](https://github.com/Stability-AI/stable-audio-3) supplies purpose-built sound generation. Its current model and Community License govern adoption.

### Audio prompting

[VoxCPM](https://github.com/OpenBMB/VoxCPM), [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) and [CosyVoice's examples](https://github.com/QwenAudio/CosyVoice/blob/main/example.py) separate voice design, instructions and reference conditioning. A family's cloning checkpoint need not accept the instructions its design checkpoint takes.

[F5-TTS inference](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/infer/README.md) covers complete reference phrases, padding, transcript alignment and text preprocessing. Its numerical limits and punctuation behavior belong to that runtime, not all speech models.

[ElevenLabs voice design](https://elevenlabs.io/docs/eleven-creative/voices/voice-design) distinguishes timbre from delivery and shows how preview text affects a voice. Its [speech guide](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices) treats normalization, pronunciation and pauses differently across versions.

[Gemini's TTS guide](https://aistudio.google.com/docs/speech-generation#prompting-guide) separates speaker identity, sustained delivery and momentary vocal events. [Drama 3's guide](https://docs.fish.audio/features/text-to-speech/drama-3) scopes direction to lines or words. Their syntaxes are endpoint-specific, not interchangeable.

[Stable Audio's prompt guide](https://stability.ai/guides/stable-audio-3-prompt-guide) grounds effects in source, action and acoustic character, music in instruments and arrangement, and continuation in surrounding audio. Instrumental generation does not establish intelligible speech or exact musical timing.

### Audio observation

[OpenAI's model modalities](https://developers.openai.com/api/docs/models/gpt-6.1-sol) and [Codex's audio input protocol](https://github.com/openai/codex/blob/rust-v0.166.0/codex-rs/protocol/src/user_input.rs) distinguish model input support from attachment transport. Check the actual model and tools before claiming auditory access.

[Claude's model inputs](https://platform.claude.com/docs/en/models/opus-5-5) and [Claude Code's dictation](https://code.claude.com/docs/en/voice-dictation) likewise separate coding-model modalities from speech-to-text. Neither decoded measurements nor transcription approves the listening experience.
