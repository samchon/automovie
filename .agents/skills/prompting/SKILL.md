---
name: prompting
description: Sets what makes an instruction for an agent work.
---

# Prompting

Apply [Writing](../documentation/writing.md) to entry files, skills and their resources. Write for a reader new to the project.

Consult the [GPT-6.2 prompting guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6.2-astra#prompting-best-practices) for model-dependent changes. Keep model, effort and tools in run configuration.

For direct Responses API integrations, follow the [prefix guidance](https://developers.openai.com/api/docs/guides/keep-prefix-unchanged) for durable instructions and appended updates.

## Content

### What to state

State the deliverable, recipient, acceptance checks and choices reserved for the user. Describe project-specific rules the code cannot show. Include a reason or example when it resolves ambiguity. Prescribe a method when it prevents a known failure.

Keep history in Git. Disclose consequential delegated choices.

### Default route

State the default first and give each optional route its enabling condition.

### One owner

Define each rule once and link to its owner. Fix its application when the rule covers the failure. Fix the owner and its links when the rule is missing or conflicts.

### Packages

The package's types and JSDoc own its API, and its README its entry points.

## Skills and contracts

For each creation step, state its output and the decisions it owns. Link to the contracts that check it.

Put a rule every Evidence-selected declaration, document or record must meet in the responsible [contract](../contracts/SKILL.md) item.

Give each statement one checkable assertion with its exceptions. Say whether failure lists are exhaustive. Where both matter, judge omission and excess together.

Check new requirements for overlap and conflicts. Record the support and limits of new quality claims before adopting them.

Use a hook or executable check for universal rules where practical. Update the check and its instructions together.

Group judgments that share the task, respondent, proof and repair owner. Give the overall outcome its own item.

## Layout

### Entry files

Keep `AGENTS.md` under 200 lines. Give each top-level skill a verb-led trigger. Include only the rules a reader needs across sessions or to start. Keep only `@AGENTS.md` in `CLAUDE.md`.

### Skill files

Give each distinct task a top-level `.agents/skills/<name>/SKILL.md`. Match `name` to its directory using at most 64 lowercase letters, digits and hyphens. Give the skill a short, specific third-person description.

### Splitting a skill

Keep `SKILL.md` well under 500 lines. Route multiple workflows from a short scope, shared rules and a trigger for each resource. See [OpenAI's skill guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).

Split unrelated workflows, task-specific sections and material the opening cannot introduce.

Put optional material beside the router. Review resources over about 100 lines for separable tasks. Name a child router for its parent and folder.

Give each resource one task it can explain on its own, a descriptive name and an opening. Link it from the nearest router, directly or by path pattern. Merge pages that add no independent guidance.

Group model instructions by technique. Keep provider examples together and defer parameters to provider documentation.

### Helpers

Reuse tested helpers for repeated deterministic work. Link the command from the relevant resource and draw examples from its existing callers.

## Shared skills

Share only rules valid for every receiving project.

Name tools, owners and records by role. Leave project decisions and paths to project skills and model-specific settings to the task.

## Verification

Check the original failure, a similar valid case and a real task through its consumers.

When authorized and available, give a fresh agent the task and raw inputs. Withhold intended changes and verdicts except where the review workflow needs them. Record actions, opened pages and guesses. For model-dependent changes, compare the same cases and record model, runtime and effort.

Check links, triggers and rule ownership. Compare outputs, pages opened and words read on the same tasks before and after. Report observed behavior and unavailable checks alongside static results.
