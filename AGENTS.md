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

Open the skill and routed pages for the task at hand.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Change geometry, rigs, assets, materials or lights |
| [benchmark-campaign](.agents/skills/benchmark-campaign/SKILL.md) | Measure AutoMovie on real productions |
| [contracts](.agents/skills/contracts/SKILL.md) | Write or review source and tests, or change Evidence selection |
| [development](.agents/skills/development/SKILL.md) | Change code, tests or workflows |
| [documentation](.agents/skills/documentation/SKILL.md) | Write a document or comment |
| [human](.agents/skills/human/SKILL.md) | Build, inspect or supervise the Human figure and viewer |
| [issue-campaign](.agents/skills/issue-campaign/SKILL.md) | Audit broadly or run repeated issue-to-PR cycles |
| [motion](.agents/skills/motion/SKILL.md) | Develop motion, its grammar, primitives or retargeting |
| [multi-agent](.agents/skills/multi-agent/SKILL.md) | Brief or supervise user-authorized workers |
| [project](.agents/skills/project/SKILL.md) | Decide product scope, ownership or commands |
| [prompting](.agents/skills/prompting/SKILL.md) | Change agent instructions or skills |
| [pull-request](.agents/skills/pull-request/SKILL.md) | Open, update or merge an authorized pull request |
| [review](.agents/skills/review/SKILL.md) | Review changes |
| [scaffold-prompting](.agents/skills/scaffold-prompting/SKILL.md) | Change scaffold code or skills, or work on production content |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Inspect pictures or change the viewer or capture |
| [website](.agents/skills/website/SKILL.md) | Change the website, its docs or its takes |
