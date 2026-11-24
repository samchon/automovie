# AGENTS.md

`automovie` lets an LLM write a film screenplay and author deterministic staging and motion as hints for video diffusion. The [project skill](.agents/skills/project/SKILL.md) owns the product contract.

## Principles

Work from evidence and fix by cause.

- Research uncertain details the task depends on. Ask the user if the answer remains unclear or sources still conflict.
- Let the run, review or inspection finish. Fix all findings together by cause.

Compute values only when and where the result needs them. Prefer closed forms and simulate only physical phases.

Keep the deliverables and the checkout clean.

- Write code, comments, documents, commits, issues and pull requests in English.
- Ship one pull request per topic.
- Delete scratch files after use.

Carry the work to completion.

- Fix a broken viewer at its owner before other work. Reconnect and verify the consumer.
- Give progress updates with the next tool call.
- Continue until the task is complete or a user decision, protected target or required approval blocks further work.
- Get approval for destructive or outward-facing actions.

## Attitude

Work with the user.

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write every message to the user in the user's language.
- Work as a single agent unless the user explicitly orders subagents.

## Skills

Open a skill when the work reaches the task its trigger names. Open only the pages its router names for that task, and read no page before the work reaches it.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Changing geometry, rigs, assets, materials or lighting |
| [benchmark-campaign](.agents/skills/benchmark-campaign/SKILL.md) | Measuring AutoMovie on real productions |
| [contracts](.agents/skills/contracts/SKILL.md) | Writing or reviewing maintained source or tests, or changing Evidence selection |
| [development](.agents/skills/development/SKILL.md) | Changing code, tests or workflows |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing any document or doc comment |
| [human](.agents/skills/human/SKILL.md) | Working on `packages/human`, a human figure or the Human viewer, or supervising that work |
| [issue-campaign](.agents/skills/issue-campaign/SKILL.md) | Running a broad audit or repeated issue-to-pull-request work |
| [motion](.agents/skills/motion/SKILL.md) | Authoring or verifying body motion, the motion vocabulary or its grammar, an action law, a motion primitive or retargeting |
| [multi-agent](.agents/skills/multi-agent/SKILL.md) | Starting, briefing or supervising subagents on the user's explicit order |
| [project](.agents/skills/project/SKILL.md) | Judging product scope, or choosing a package owner or a command |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [pull-request](.agents/skills/pull-request/SKILL.md) | Pushing, opening, updating or merging a pull request, when asked or under a delivery mandate |
| [review](.agents/skills/review/SKILL.md) | Doing any review or self-review |
| [scaffold-prompting](.agents/skills/scaffold-prompting/SKILL.md) | Editing `packages/template` or its shipped skills, or reading, authoring or reviewing production content |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging anything on screen, before claiming a visual change works, or changing a viewer or capture |
| [website](.agents/skills/website/SKILL.md) | Changing the public website: its pages, design, docs or baked takes |
