---
name: prompting
description: Owns what makes an instruction for an agent work, namely what to state, reasons and examples, one owner per rule, routing to packages, the layout and splitting of skills, what a shared skill may hold and how a prompt is verified. Use before changing AGENTS.md, CLAUDE.md or a skill.
---

# Prompting

Every prompt follows the documentation skill's [Writing](../documentation/writing.md) rules, applying their first-reading test as someone new to the project, because wording that serves that person serves the agent too. The rules here are what makes an instruction for an agent work.

Before editing a prompt, fetch and read in full the current prompting guide for the model that will read it, rather than recalling it, because it changes with each model. Where it disagrees with the user's rules in this repository, the user's rules win.

## What to state

State only facts the code does not show, rules the user set, and mistakes an agent made. Leave dates and history to git.

Write each instruction concretely enough that a reader can tell whether it was followed.

Writing asks for a reason when it is not obvious. For a consequential instruction, that reason names who loses what when it is missed and sits in the instruction itself, because a source comment or an unexplained prohibition cannot guide a case the instruction did not list.

Leave the method to the agent unless a known failure requires a particular order or boundary. Where a skill does name methods, it gives one default and says when to leave it.

Give an example only where the rule alone leaves the pattern unclear, and keep examples few and varied, because an agent copies an example's surface.

## One owner

Every other place links to a rule's one owner, as [Writing](../documentation/writing.md) requires, so a task receives one consistent requirement. Moving a rule updates its callers.

Resolve two conflicting instructions inside the prompts by changing one of them, never by adding an instruction about which one wins, because a model applies a stated priority unreliably.

## Packages

A skill routes to a package and stops there; naming the package is the routing. It carries no function name, command line or file path that a package owns, and it lists no package's features, because a copy in a skill cannot be kept in step with the package. The package's README and types own them.

## Skills and contracts

A skill gives a job's goal, order and boundaries, and points to the checklists it relies on without restating their items.

An agent does not reliably follow long, detailed or conditional prose. A rule that every declaration must meet therefore belongs in a [contracts](../contracts/SKILL.md) checklist as one question under its own H2. Evidence makes each selected declaration answer it, and [review](../review/SKILL.md) checks that the answer is true and complete. A rule that must hold on every action, such as a forbidden command, belongs in a hook or a check that runs, because prose can be missed.

Put questions the agent can answer together in one checklist item, and split them when their task, respondent (whoever answers), evidence or repair owner differs. Keep overall achievement distinct from passing its detailed tests.

## Layout

### Entry files

[`AGENTS.md`](../../../AGENTS.md) holds what every session needs, in under 200 lines, and lists every top-level skill with its trigger, because Claude Code finds skills only there. Lead each trigger with the words of the task it serves. [`CLAUDE.md`](../../../CLAUDE.md) is `@AGENTS.md`.

### Skill files

A skill is `.agents/skills/<name>/SKILL.md`, with `name` equal to the directory and a third-person `description` that says what it does and when to use it. A job with its own trigger gets its own skill.

### Splitting a skill

`SKILL.md` stays a short overview, far under 500 lines: what the skill is for, when to read it, and which resource each task needs. An agent loads it on every use of the skill, so everything in it that the task at hand does not need costs attention on every task. Put first what every use needs, because an agent follows earlier text more reliably and a compacted context keeps only the start.

Split when any of these shows:

- several unrelated branches in one file;
- a branch only some tasks take;
- more content than the opening can introduce.

A branch moves into a sibling file, and a resource longer than about 100 lines usually holds a branch to move. A group of files with one purpose moves into a subfolder with its own routing `SKILL.md`, at any depth, whose `name` joins the parent's and the folder's, such as `story-planning`.

Each sibling file has these three marks:

- a name that states its subject;
- an opening that states its subject, in its own words;
- a direct link from the router of its own folder, never only through another resource.

### Helpers

Put repeated deterministic operations in tested helpers, reusing existing tools before adding another. Link their task-specific invocation from the relevant guide, and take examples from working consumers rather than copying their implementation into the prompt.

## Shared skills

A skill shared with other projects, such as one a project template ships, holds only what is universal, orthodox and valid in every receiving project, because each of them follows it as written. It names tools, owners and records by their role, leaves one project's paths, packages and decisions to that project's own skills, and assumes no particular agent model.

## Verification

Start a change from the actual failure it must fix, kept as a case, and check the changed instructions against that case and the strongest similar legitimate case they must leave alone.

Check that links resolve, triggers reach their resources and each rule has one owner. Compare the instructions with a real governed task and its actual consumers.

When a separate context is available and authorized, give it the task and raw inputs without the intended answer and observe its choices.

Report static inspection, behavioral observation and unavailable checks separately. Explaining a rule does not prove another session follows it.
