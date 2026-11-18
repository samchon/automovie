---
name: prompting
description: Sets what makes an instruction for an agent work.
---

# Prompting

Apply [Writing](../documentation/writing.md) to entry files, skills and their resources. Write for a reader new to the project.

Base agent instructions on the current [GPT-6.2 prompting guide](https://developers.openai.com/api/docs/guides/latest-model/gpt-6.2-astra#prompting-best-practices) and consult it for model-dependent changes. Keep model, effort and tools in run configuration.

For direct Responses API integrations, follow the [prefix guidance](https://developers.openai.com/api/docs/guides/keep-prefix-unchanged) for durable instructions and appended updates.

## Content

### What to state

State checkable requirements and failure cases the code does not show. Keep history in Git.

Explain a rule when its reason guides unlisted cases.

Prescribe a method only to prevent a known failure.

State the deliverable, recipient, acceptance checks and decisions reserved for the user. Disclose consequential delegated choices.

Use a short example when it disambiguates the rule.

### Default route

State the default first.

List each optional route, folder, command or stage with its enabling condition.

### One owner

Define each rule in one section. Link to that section from its consumers and update the links when the rule moves.

Fix an existing rule's application when it covers the failure. Change the rule at its owner when coverage is missing or conflicting.

### Packages

The package's types and JSDoc own its API, and its README its entry points.

## Skills and contracts

For creation tasks, state what to make, which decisions belong to this step and what the next step can decide. Keep detailed failure checks in the relevant contracts and link to them.

Put a rule every Evidence-selected declaration, document or record must meet in the responsible [contract](../contracts/SKILL.md) item.

Give each statement one checkable assertion with its exceptions. Say whether failure lists are exhaustive. Where both matter, judge omission and excess together.

Check new requirements for overlap and conflicts. Record the support and limits of new quality claims before adopting them.

Enforce rules that apply to every action with a hook or executable check.

Update the check and its documented rule together.

Group judgments that share the task, respondent, proof and repair owner. Give the overall outcome its own item.

## Layout

### Entry files

Keep `AGENTS.md` under 200 lines. Include only session-wide rules and a trigger for each top-level skill.

Start each trigger with the task's verb. Keep only `@AGENTS.md` in `CLAUDE.md`.

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
