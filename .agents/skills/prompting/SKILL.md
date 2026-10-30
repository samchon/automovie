---
name: prompting
description: Defines common prompt-writing principles for AGENTS.md, CLAUDE.md and skills. Use before changing agent instructions; scaffold-prompting owns production skill and contract design.
---

# Prompting

A prompt follows the documentation skill's [Writing](../documentation/writing.md) rules. Before editing one, fetch and read [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) in full rather than relying on memory, because it changes with each model. Where it disagrees with the user's rules in this repository, the user's rules win.

Write only facts the code does not show, rules the user set, and mistakes an agent made, and leave dates and history to git.

Give a consequential instruction a short reason stating who loses what when it is missed. Put that reason in the instructions the recipient actually reads; a source comment or an unexplained prohibition cannot guide an unlisted case. Keep method choices open unless the failure requires a particular order or boundary.

## Skills And Contracts

A skill gives a job's goal, order, and boundaries, and points to the checklists it relies on without restating their items.

Give each rule one owner and update its callers when moving it, so a task receives one consistent requirement. Group judgments the agent can make together; split when their task, respondent or repair owner differs. Keep overall achievement distinct from passing its detailed tests.

Use [scaffold-prompting](../scaffold-prompting/SKILL.md) for the strategy and contract design of instructions shipped to productions. Repository engineering questions remain with [contracts](../contracts/SKILL.md); production questions must use respondents that can establish their actual creative or media result.

An agent does not reliably follow long, detailed, or conditional prose, so a rule that every declaration must meet belongs in a [contracts](../contracts/SKILL.md) checklist as an H2 question. Evidence makes each selected declaration answer it, and [review](../review/SKILL.md) checks that the answer is true and complete.

## Layout

- [`AGENTS.md`](../../../AGENTS.md) holds what every session needs, under 200 lines, and lists every skill, because Claude Code finds skills only there. [`CLAUDE.md`](../../../CLAUDE.md) is `@AGENTS.md`.
- A skill is `.agents/skills/<name>/SKILL.md` with `name` equal to the directory and a third-person `description` saying what it does and when to use it.
- `SKILL.md` is the overview. Move a branch that only some tasks need into a sibling file linked directly from it, give a job with its own trigger its own skill, and never nest skills.
- Put repeated deterministic operations in tested helpers, reusing existing tools before adding another. Link their task-specific invocation from the relevant guide, and take examples from working consumers rather than duplicating their implementation in the prompt.

## Verification

Check that links resolve, triggers reach their resources and each rule has one owner. Compare the instructions with a real governed task and its actual consumers. When a separate context is available and authorized, give it the task and raw inputs without the intended answer and observe its choices. Report static inspection, behavioral observation and unavailable checks separately; explaining a rule does not prove another session follows it.
