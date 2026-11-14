# MiniMax-H3

Hosted, and as open weights. Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** up to 3 reference videos of 2 to 15 s each and 15 s in total, at 23.976 to 60 fps.
- **Output:** 4 to 15 s at 24 fps, 768P or 2K. The hosted regeneration step upscales a 768P take to 2K; the open weights reach 2K only through a model not yet released.
- **Adherence:** wording that gives each `<Video N>` its role: editing it, continuing from its end, or taking its camera, cuts or rhythm.
- **References:** up to 9 images and 3 audio clips, 12 files in all. First and last frames cannot be mixed with references.
- **Prompt:** up to 7,000 characters.
- **Sound:** generated in 32 kHz stereo. Dialogue goes only inside `<d>[Language] …</d>` with speaker IDs such as `(S1)`, and ambience and music in their own fields.
- **Continuing a take:** a continuation task over a reference video, inside the 15 s total. Chaining by last frame excludes the hint video, because frames and references do not mix.

Documentation: [guide](https://platform.minimax.io/docs/guides/video-generation), [API](https://platform.minimax.io/docs/api-reference/video-generation-v2-create.md), [prompting](https://huggingface.co/MiniMaxAI/MiniMax-H3/raw/main/docs/VIDEO_PROMPT_WRITING_GUIDE_ref_en.md), [weights](https://huggingface.co/MiniMaxAI/MiniMax-H3).
