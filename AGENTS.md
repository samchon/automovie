# AGENTS.md

`automovie` lets an LLM write a film screenplay and author deterministic staging and motion as hints for video diffusion. The [project skill](.agents/skills/project/SKILL.md) owns the product contract.

## Principles

Fix by cause and compute by need:

- Let a run, review or inspection finish, then fix all its findings by cause at once, leaving none for later.
- Compute only the values a result uses, when and where it uses them; prefer a closed form, and simulate only physical phases.

Keep the deliverables and the checkout clean:

- Write code, comments, documents, commits, issues and pull requests in English.
- Ship each topic as its own pull request.
- Delete every scratch file once it has served.

Carry the work to its end:

- Restore a broken viewer before other work: add the missing capability to its owning package, then reconnect and check it.
- End no turn on a next-step summary, an offer, non-blocking decisions, a stage report or a wait on background work.
- A message without a tool call ends the turn, so put status notes in the message with the next tool call.
- Stop only when nothing can move without the user, a protected target blocks you, or a destructive or outward-facing step needs approval.

## Attitude

Work with the user by these rules:

- Do the literal request, widening it only when the user hands that over.
- Follow the user's instruction over any skill.
- Answer a question from the user before continuing any work.
- Write every message to the user in the user's language.

## Skills

Open a skill when the work reaches the task its trigger names. Open only the pages its router names for that task, and read no page before the work reaches it.

| Skill | Use when |
| --- | --- |
| [3d-modeling](.agents/skills/3d-modeling/SKILL.md) | Changing geometry, rigs, assets, materials or lighting |
| [contracts](.agents/skills/contracts/SKILL.md) | Writing or reviewing maintained source or tests, or changing Evidence selection |
| [development](.agents/skills/development/SKILL.md) | Changing code, tests or workflows |
| [documentation](.agents/skills/documentation/SKILL.md) | Writing any document or doc comment |
| [human](.agents/skills/human/SKILL.md) | Working on `packages/human`, a human figure or the Human viewer, or supervising that work |
| [issue-campaign](.agents/skills/issue-campaign/SKILL.md) | Running a broad audit or repeated issue-to-pull-request work |
| [motion](.agents/skills/motion/SKILL.md) | Authoring or verifying body motion, the motion vocabulary or its grammar, an action law, a motion primitive or retargeting |
| [production-campaign](.agents/skills/production-campaign/SKILL.md) | Running authoring campaigns with writers and reviewers as CLI processes, or observing or comparing productions |
| [project](.agents/skills/project/SKILL.md) | Judging product scope, or choosing a package owner or a command |
| [prompting](.agents/skills/prompting/SKILL.md) | Changing `AGENTS.md`, `CLAUDE.md` or a skill |
| [pull-request](.agents/skills/pull-request/SKILL.md) | Pushing, opening, updating or merging a pull request, when asked or under a delivery mandate |
| [review](.agents/skills/review/SKILL.md) | Doing any review or self-review |
| [scaffold-prompting](.agents/skills/scaffold-prompting/SKILL.md) | Editing `packages/template` or its shipped skills, or reading, authoring or reviewing production content |
| [visual-debugging](.agents/skills/visual-debugging/SKILL.md) | Judging anything on screen, before claiming a visual change works, or changing a viewer or capture |
