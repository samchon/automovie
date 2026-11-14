---
name: prompting
description: Owns what makes an instruction for an agent work, namely what to state, reasons, one owner per rule, routing to packages, the layout and splitting of skills, what a shared skill may hold and how a prompt is verified. Use before changing AGENTS.md, CLAUDE.md or a skill.
---

# Prompting

Every prompt follows the documentation skill's [Writing](../documentation/writing.md) rules. The rules here are what makes an instruction for an agent work.

The best skill is one a person finds orderly at a glance and understands at once, because structure and wording that serve a human reader serve the agent too. Test a changed skill by reading it top to bottom as someone new to the project, and fix whatever makes that reader slow down, reread or hunt for where a rule lives.

Before editing a prompt, fetch and read in full the current prompting guide for the model that will read it, rather than recalling it, because it changes with each model. Where it disagrees with the user's rules in this repository, the user's rules win.

## What to state

State only facts the code does not show, rules the user set, and mistakes an agent made. Leave dates and history to git.

The writing rules ask for a reason when it is not obvious. For a consequential instruction, the reason also says who loses what when it is missed, and it sits in the instruction the recipient reads, because a source comment or an unexplained prohibition cannot guide a case the instruction did not list.

Keep method choices open unless the failure requires a particular order or boundary.

## One owner

Give each rule one owner, in one section of one file, and let every other place link to it, so a task receives one consistent requirement. Update a rule's callers when moving it.

## Packages

A skill routes to a package and stops there; naming the package is the routing. It carries no function name, command line or file path that a package owns, and it lists no package's features, because a copy in a skill cannot be kept in step with the package. The package's README and types own them.

## Skills and contracts

A skill gives a job's goal, order and boundaries, and points to the checklists it relies on without restating their items.

An agent does not reliably follow long, detailed or conditional prose. A rule that every declaration must meet therefore belongs in a [contracts](../contracts/SKILL.md) checklist as one question under its own H2. Evidence makes each selected declaration answer it, and [review](../review/SKILL.md) checks that the answer is true and complete.

Group judgments the agent can make together, and split them when their task, respondent (whoever answers the question) or repair owner differs. Keep overall achievement distinct from passing its detailed tests.

## Layout

### Entry files

[`AGENTS.md`](../../../AGENTS.md) holds what every session needs, in under 200 lines, and lists every top-level skill with its trigger, because Claude Code finds skills only there. [`CLAUDE.md`](../../../CLAUDE.md) is `@AGENTS.md`.

### Skill files

A skill is `.agents/skills/<name>/SKILL.md`, with `name` equal to the directory and a third-person `description` that says what it does and when to use it. A job with its own trigger gets its own skill.

### Splitting a skill

`SKILL.md` stays a short overview: what the skill is for, when to read it, and which resource each task needs. An agent loads it on every use of the skill, so everything in it that the task at hand does not need costs attention on every task.

Split when any of these shows:

- several unrelated branches sit in one file;
- a branch only some tasks take;
- a length the opening can no longer introduce.

A branch moves into a sibling file. A group of files with one purpose moves into a subfolder with its own routing `SKILL.md`, at any depth, whose `name` joins the parent's and the folder's, such as `story-planning`.

Each sibling file has:

- a name that states its subject, so a reader picks it from the listing alone;
- an opening that states its subject, in its own words;
- a direct link from its router, never a chain more than one step long.

### Helpers

Put repeated deterministic operations in tested helpers, reusing existing tools before adding another. Link their task-specific invocation from the relevant guide, and take examples from working consumers rather than copying their implementation into the prompt.

## Shared skills

A skill shared with other projects, such as one a project template ships, holds only what is universal, orthodox and valid in every receiving project, because each of them follows it as written. It names tools, owners and records by their role, and leaves one project's paths, packages and decisions to that project's own skills.

## Verification

Check that links resolve, triggers reach their resources and each rule has one owner. Compare the instructions with a real governed task and its actual consumers.

When a separate context is available and authorized, give it the task and raw inputs without the intended answer and observe its choices.

Report static inspection, behavioral observation and unavailable checks separately. Explaining a rule does not prove another session follows it.
