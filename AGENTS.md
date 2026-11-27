# AGENTS.md

`automovie` lets an LLM write a screenplay and author deterministic staging and motion hints for video diffusion. See the [product contract](.agents/skills/project/SKILL.md).

## Principles

Work from evidence and fix by cause.

- Research uncertainties that affect the task. Ask the user if the answer remains unclear or sources conflict.
- Finish each run, review or inspection before fixing its findings together by cause.

Compute values where and when needed. Prefer closed forms and simulate only physical phases.

Keep deliverables and the checkout clean.

- Write code, comments, documents, commits, issues and pull requests in English.
- Ship one pull request per topic.
- Delete scratch files after use.

Carry the work to completion.

- Fix a broken viewer at its owner first. Reconnect and verify the consumer.
- Give progress updates with the next tool call.
- Finish the task unless a user decision, protected target or required approval blocks progress.
- Get approval for destructive or outward-facing actions.

## Attitude

Work with the user.

- Follow the request as given. Widen it only when the user delegates that choice.
- Give the user's instructions precedence over skills.
- Answer the user's questions before resuming work.
- Write to the user in their language.
- Work alone unless the user explicitly orders subagents.

Directors, writers, reviewers and Evidence answerers pursue perfection. Each inspects the work firsthand and rejects every defect or unnatural detail, however small.

## Skills

Open the applicable skill and only the pages it routes you to for this task.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Change geometry, rigs, assets, materials or lighting |
| [benchmark-campaign](.agents/skills/benchmark-campaign/SKILL.md) | Measure AutoMovie on real productions |
| [contracts](.agents/skills/contracts/SKILL.md) | Write or review maintained source or tests, or change Evidence selection |
| [development](.agents/skills/development/SKILL.md) | Change code, JSDoc, tests or workflows |
| [documentation](.agents/skills/documentation/SKILL.md) | Write a repository document |
| [human](.agents/skills/human/SKILL.md) | Work on or oversee `packages/human`, human figures or the Human viewer |
| [issue-campaign](.agents/skills/issue-campaign/SKILL.md) | Run a broad audit or repeated issue-to-PR rounds |
| [motion](.agents/skills/motion/SKILL.md) | Author or verify body motion, vocabulary, grammar, laws, primitives or retargeting |
| [multi-agent](.agents/skills/multi-agent/SKILL.md) | Start, brief or supervise authorized subagents |
| [project](.agents/skills/project/SKILL.md) | Decide scope, package ownership or commands |
| [prompting](.agents/skills/prompting/SKILL.md) | Change `AGENTS.md`, `CLAUDE.md` or a skill |
| [pull-request](.agents/skills/pull-request/SKILL.md) | Push, open, update or merge a PR on request or under a delivery mandate |
| [review](.agents/skills/review/SKILL.md) | Review or self-review |
| [scaffold-prompting](.agents/skills/scaffold-prompting/SKILL.md) | Change `packages/template` or shipped skills, or work on production content |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Inspect pictures, verify visual changes or change a viewer or capture |
| [website](.agents/skills/website/SKILL.md) | Change public website pages, design, docs or baked takes |
