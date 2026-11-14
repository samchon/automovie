# Veo 3.1

On Vertex AI; the Gemini API preview has shut down. Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** still frames only, a first frame or a first and last frame, which [shot frames](../../image/SKILL.md#shot-frames) makes from the hint.
- **Output:** 4, 6 or 8 s at 24 fps, 720p, 1080p or 4K; 8 s when references are given.
- **Adherence:** none; it keeps only the frames.
- **References:** up to 3 asset images of one subject per request.
- **Prompt:** English only, with a negative prompt and a seed. Repeat each character's description unchanged and keep the seed, but do not describe again what a first frame already shows.
- **Sound:** generated. Write a line as the speaker, a colon and the words without quotation marks, which keeps the line from rendering as text, and give each character a name and a voice style.
- **Continuing a take:** extend adds 7 s to a 1 to 30 s video, up to 37 s, from a prompt alone, with no references or frames.

Documentation: [model](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate), [references](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/use-reference-images-to-guide-video-generation), [extend](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/extend-a-veo-video), [prompting](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide), [best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice).
