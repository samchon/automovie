# Codex image generation

Values were read from the linked documentation in November 2026; it owns them, so read it again when choosing.

- **Reached through:** the `$imagegen` skill or a plain request in Codex, under the ChatGPT plan with no API key; use counts toward Codex's limits. It runs a GPT Image model.
- **Files:** it saves under Codex's own home directory, so copy each accepted image into the production and record it.
- **Edits:** only on images visible in the conversation, so view a saved file before editing it.
- **Seed:** none.

Documentation: [Codex image generation](https://learn.chatgpt.com/codex/image-generation), [the skill](https://github.com/openai/skills/blob/main/skills/.system/imagegen/SKILL.md).
