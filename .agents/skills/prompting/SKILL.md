---
name: prompting
description: Owns what makes an instruction for an agent work, namely what to state, reasons and examples, one owner per rule, routing to packages, the layout and splitting of skills, what a shared skill may hold and how a prompt is verified. Use before changing AGENTS.md, CLAUDE.md or a skill.
---

# Prompting

A prompt is any instruction an agent reads: `AGENTS.md`, `CLAUDE.md`, a skill or one of its resources. Every prompt follows the documentation skill's [Writing](../documentation/writing.md) rules, with someone new to the project as the reader, because wording that serves that person serves the agent too. The rules below are what makes a prompt work for an agent.

Before editing a prompt, fetch and read in full the current prompting guide for the model that will read it, rather than recalling it, because it changes with each model. Where it disagrees with the user's rules in this repository, the user's rules win.

## What to state

State only facts the code does not show, rules the user set, and mistakes an agent made, each concretely enough that a reader can tell whether it was followed. Leave dates and history to git.

[Writing](../documentation/writing.md) asks for a reason when it is not obvious. For a consequential instruction, that reason names who loses what when it is missed and sits in the instruction itself, because a source comment or an unexplained prohibition cannot guide a case the instruction did not list.

Leave the method to the agent unless a known failure requires a particular order or boundary. Where a skill does name methods, it gives one default and says when to leave it.

Keep examples few and varied, because an agent copies an example's surface.

## One owner

Give each rule one owner, the one section of one file that states it, as [Writing](../documentation/writing.md) requires, and link to it from every other place that needs it, so a task receives one consistent requirement. When moving a rule, update every link to it.

Resolve two conflicting rules in the skills or `AGENTS.md` that one project owns by changing one of them, never by adding a rule about which one wins, because a model applies a stated priority unreliably.

## Packages

A skill that needs a package names it and leaves the rest to it. Unless the skill maintains that package, it copies none of the package's function names, command lines, file paths or features, because a copy in a skill cannot be kept in step with the package. The package's types and JSDoc own its API, and its README its entry points.

## Skills and contracts

A skill gives a job's goal and boundaries, and points to the checklists it relies on without restating their items.

An agent does not reliably follow long, detailed or conditional prose. A rule that every declaration, document or record Evidence selects must meet therefore belongs in a [contracts](../contracts/SKILL.md) checklist, under the item whose question covers it or as a new item under its own H2. Each selected one answers it as the item's respondent, and the contracts skill names who checks that the answer is true and complete.

A rule that must hold on every action, such as a forbidden command, belongs in a hook or a check that runs, not only in prose, because prose can be missed.

Put judgments the agent makes in one reading into one checklist item, and split them into separate items when their task, respondent, proof or repair owner (whoever fixes a failure) differs. Ask about the overall achievement in its own item, separate from the items that check its parts, because passing every part does not prove the whole works.

## Layout

### Entry files

[`AGENTS.md`](../../../AGENTS.md) holds what every session needs, in under 200 lines, and lists every top-level skill with its trigger, the task that calls for it, because an agent that does not scan `.agents/skills` finds a skill only through `AGENTS.md`. Start each trigger with the task's verb, such as `Changing` or `Reviewing`. [`CLAUDE.md`](../../../CLAUDE.md) holds only `@AGENTS.md`, which imports that file.

### Skill files

A job with its own trigger gets its own top-level skill at `.agents/skills/<name>/SKILL.md`. Its `name` equals the directory and uses lowercase letters, digits and hyphens, within 64 characters. Its third-person `description`, within 1024 characters, says what the skill does and when to use it.

### Splitting a skill

`SKILL.md` stays short, far under 500 lines: what the skill is for, when to read it, and, once it has resources, which resource each task needs. An agent loads it on every use of the skill, so everything in it that the task at hand does not need costs attention on every task. Put first what every use needs, because an agent follows earlier text more reliably and a compacted context keeps only the start.

Split when any of these shows:

- several unrelated tasks in one file;
- a section only some tasks need;
- more content than the opening can introduce.

Such a section moves into a resource file beside `SKILL.md`, and a resource longer than about 100 lines usually holds one to move. A group of files with one purpose moves into a subfolder with its own routing `SKILL.md`, at any depth, whose `name` joins the parent's and the folder's, such as `story-planning`.

Each resource needs three things:

- a name that states its subject;
- an opening that states its subject, in its own words;
- a direct link, or a stated path pattern, from the nearest router above it.

### Helpers

Put repeated deterministic operations in tested helpers, reusing existing tools before adding another. Link each helper's command for a task from the resource covering that task, and take examples from code that already calls the helper rather than copying the helper's code into the prompt.

## Shared skills

A skill shared with other projects, such as one a project template ships, holds only what is universal, orthodox and valid in every receiving project, because each of them follows it as written. It names tools, owners and records by their role, leaves one project's paths, packages and decisions to that project's own skills, and assumes no particular agent model.

## Verification

Start a change from the actual failure it must fix, kept as a case. Check the changed instructions against that case, against the strongest similar legitimate case they must leave unchanged, and against a real task they govern, including the files that use that task's result. When a separate agent session is available and authorized, give it the task and raw inputs without the intended answer and observe its choices.

Check statically that links resolve, triggers reach their resources and each rule has one owner. Report static inspection, behavioral observation and unavailable checks separately, because explaining a rule does not prove another session follows it.
