# Kling 4.0 Omni

Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** up to 5 videos of 3 to 30 s each and at most 30 s in total, one of them the base video to edit and the others feature references.
- **Output:** 3 to 30 s at 24 fps, 720p or 1080p through the API; 4K only in the app.
- **Adherence:** the input's type or wording: "Edit @Video" edits the base video, "Reference @Video" makes a new shot from it.
- **References:** up to 15 assets: 10 images, 5 videos, 7 elements and 3 voices. An element is a front image with 1 to 3 other views, each at least 300 px and within 1:2.5 to 2.5:1.
- **Prompt:** up to 26,000 English characters through the API, with no negative field or seed. State each asset's role, because the model guesses an unlabeled one.
- **Sound:** generated in stereo, or the input video's own sound kept. Dialogue goes in quotation marks in one of its 9 languages; a voice profile needs 5 to 30 s of audio, at most 3 per request.
- **Continuing a take:** extension of a 4.0 take is not yet available. The previous take can go in as a feature video beside the hint as the base video, a pairing the docs do not show. Keyframes and Omni references do not combine in one request.

Documentation: [API](https://kling.ai/document-api/api/video/4-0/video-omni), [elements](https://kling.ai/document-api/api/video/4-0/elements.md), [guide](https://kling.ai/quickstart/kling-4-model-user-guide).
