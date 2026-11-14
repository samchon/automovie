# Runway Aleph 2.0

Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** one video to edit or restyle, 2 to 30 s at up to 30 fps.
- **Output:** the input's length, at its resolution up to 1080p.
- **Adherence:** no setting; it keeps what the prompt does not ask to change.
- **References:** up to 5 keyframe images, each placed at a second or a range.
- **Prompt:** up to 1,000 characters.
- **Sound:** none documented.
- **Continuing a take:** no extend mode and one video per request, so a continuing request places the previous take's last frame as its first keyframe.
- **After generation:** Runway's upscaler raises a take to 4K, and its frame-rate enhancement retimes to 24 to 120 fps.

Documentation: [models](https://docs.dev.runwayml.com/guides/models.md), [API](https://docs.dev.runwayml.com/api.md), [prompting](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide).
