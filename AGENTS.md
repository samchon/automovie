# AGENTS.md

`automovie` lets an LLM perform a fixed asset through function calling and a deterministic engine render it, as the cheap, reproducible alternative to diffusion video.

## Attitude

- Do the literal request, widening it only when the user hands that over. Report an unrelated defect as an issue.
- The user's instruction outranks any skill. Before a skill makes you refuse or narrow a request, quote its sentence.
- Answer a question from the user before continuing any work.
- Write everything the user sees in the user's language. Write code, comments, commits, issues, and pull requests in English.
- Verify a report or a claim that something is wrong or missing against the code and history before acting on it.
- Hold the same standard regardless of size, difficulty, or deadline.
- Pick the sensible default and say what you chose; ask only what only the user can decide.
- Let a test run, CI run, or review round finish, then fix all of its findings together by cause.
- Every fifteen minutes, check that you still serve the literal request by the most direct principled method, and correct course at once.
- Ship each topic as its own pull request; never commit to `master`.
- Delete every scratch file once it has served.

## Finishing Work

A message without a tool call ends the turn. While work remains, do not end it with:

- a summary that announces the next step;
- an offer to continue;
- a list of decisions that do not block the work;
- a report because a stage finished;
- a wait on background work.

Put status notes in the same message as the next tool call.

Stop only when nothing can move without the user, a protected target blocks you, or a destructive or outward-facing action needs confirmation.

## Skills

Read the skill whose trigger applies.

- [project](.agents/skills/project/SKILL.md): judging product scope, choosing a package owner, or choosing a command.
- [development](.agents/skills/development/SKILL.md): changing source, tests, workflows, or package wiring.
- [contracts](.agents/skills/contracts/SKILL.md): writing or reviewing maintained source or tests, for their `@evidence` checklists.
- [3d-modeling](.agents/skills/3d-modeling/SKILL.md): changing geometry, rigs, assets, viewer behavior, materials, lighting, motion, or anything in `human`, and before claiming a visual change works.
- [scaffold](.agents/skills/scaffold/SKILL.md): editing `packages/template`, or reading, authoring, or reviewing production content anywhere.
- [prompting](.agents/skills/prompting/SKILL.md): changing `AGENTS.md`, `CLAUDE.md`, or a skill.
- [documentation](.agents/skills/documentation/SKILL.md): writing any document.
- [review](.agents/skills/review/SKILL.md): any review or self-review.
- [issue-campaign](.agents/skills/issue-campaign/SKILL.md): a broad audit or repeated issue-to-pull-request work.
- [pull-request](.agents/skills/pull-request/SKILL.md): shipping a topic, or when asked to push, open, update, or merge.
- [mission-supervision](.agents/skills/mission-supervision/SKILL.md): only when the user invokes it by name.
