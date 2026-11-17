---
name: scaffold-prompting
description: Owns the design of what AutoMovie productions receive, namely the product principles every shipped skill serves, task design, the shape and reading cost of the skill tree, contracts with their statements, research support and verification. Use before editing packages/template, when adding, revising or auditing scaffold instructions, and before reading, authoring or reviewing production content; prompting owns what makes an instruction work.
---

# Scaffold prompting

Scaffold prompting designs the skills, contracts and routers a production receives. It builds on [prompting](../prompting/SKILL.md) for what makes an instruction work and on the documentation [writing rules](../documentation/writing.md) for how text reads, and repeats neither.

| Read | To |
| --- | --- |
| [Task design](task-design.md) | Design or revise a task skill, a route or a page |
| [Layout](layout.md) | Place pages in the tree and keep a task's reading short |
| [Contract design](contract-design.md) | Change a contract item, its statements or its judgment boundary |
| [Research routes](research-routes.md) | Find a primary source for a new instruction |
| [Verification](verification.md) | Check a change before reporting it |

## Product principles

Every shipped sentence serves these principles, and one that works against any of them is a defect. The [product contract](../project/SKILL.md#product-contract) fixes the product's purpose and scope.

### Coarse models, detailed motion

No shipped instruction makes a scene depend on surface detail. A motion hint's appearance comes from diffusion and its value from motion; detail is a delivery option, as the [product contract](../project/SKILL.md#coarse-models-detailed-motion) sets.

### Screenplay detail

Every exchange, outcome and reaction is decided in the [screenplay](../../../packages/template/scaffold/instructions/.agents/skills/story/layers/screenplay.md). Code and generation prompts realize it and never choose one.

### Reuse

Composing the installed packages is the default every task page states first, as [task design](task-design.md#the-default-path) sets. A production varies a module instead of copying it, under its [package](../../../packages/template/scaffold/instructions/.agents/skills/automovie/SKILL.md) and [one module](../../../packages/template/scaffold/instructions/.agents/skills/development/source-layout.md#one-module) rules.

### Two story routes

Every instruction works on the short and the long [route](../project/SKILL.md#commissions), and leaves the choice between them to the production's [route choice](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/routes.md#choosing-the-route). The long route keeps its four layers, each with construction, evidence, independent review and whole-work completion; compact items within them rather than remove a layer. Keep the production's [commissioned outputs](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md#commissioned-outputs) distinct.

### Skills and contracts

A skill gives the job and its boundaries. A rule every selected respondent must meet lives in a contract, as prompting's [skills and contracts](../prompting/SKILL.md#skills-and-contracts) sets.

### Stills only

No instruction asks the agent to watch playback, listen or read aloud. The production's [observation rule](../../../packages/template/scaffold/instructions/AGENTS.md#what-you-can-observe) says what it sees and asks the user for the rest.

## Repository and scaffold

A rule that holds in every project lives in a repository skill and ships through an empty `$` placeholder, which the template package's source documents. Edit it at its repository source under the [shared skill](../prompting/SKILL.md#shared-skills) rule, never as a second copy.

The scaffold keeps its own text only where a production's stance differs, such as a production installing a package this repository develops. Its skills describe making a production, not developing this repository.

Shipped text stays production-neutral: a work's genre, language, voice and delivery decisions belong to the production. A project path it names is the production's own, and none of its links leaves `.agents`.

The scaffold's `lint.config.ts` stays generic and names no folder. Its default lint and evidence configurations serve ordinary TypeScript development, and narrative work opts into its additional workflow while keeping the engineering checks.

A production's own `AGENTS.md`, README and source own its meaning. Read them before interpreting, authoring or reviewing production content, fixtures and sandboxes included, because repository instructions never override them.

This skill adds no authoring step, Evidence stage or permission to publish.