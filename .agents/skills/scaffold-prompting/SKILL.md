---
name: scaffold-prompting
description: Owns the design of what AutoMovie productions receive, namely the product principles every shipped skill serves, task strategy, contracts with their statements, and the relation between root skills and the scaffold. Use when adding, revising or auditing scaffold instructions; prompting owns what makes an instruction work and scaffold owns distribution.
---

# Scaffold prompting

Scaffold prompting designs what productions receive. It builds on [prompting](../prompting/SKILL.md) for what makes an instruction work and on the documentation [writing rules](../documentation/writing.md) for how text is written, and repeats neither.

| Task | Read |
| --- | --- |
| Change a strategy, a responsibility or a route | [Task design](task-design.md) |
| Change an item, its statements or its judgment boundary | [Contract design](contract-design.md) |
| Find a primary source for a new instruction | [Research routes](research-routes.md) |
| Check the change before reporting it | [Verification](verification.md) |

## Product principles

Every shipped skill serves these six principles, and a shipped sentence that works against one is a defect. The [project contract](../project/SKILL.md) fixes the product's purpose and scope; each principle here says what that means for a shipped instruction.

### Coarse models, detailed motion

The product contract sets [coarse models and detailed motion](../project/SKILL.md#coarse-models-detailed-motion). A shipped skill therefore never asks for surface detail to make a scene work: a hint's appearance comes from diffusion and its value from motion.

### The screenplay carries the detail

The screenplay decides every exchange, outcome and reaction, and a film composes APIs along it. Every object and motion is a reusable module varied by parameters and seed, never by a copied variant, and a module several productions use moves to the workspace's shared packages.

### Installed capability is reused

A production composes what its installed packages provide and writes only what they lack. It cannot repair an installed package, so a defect goes to the upstream tracker through the user.

### Two story routes

The product contract sets the [two routes](../project/SKILL.md#commissions): a short, and long work for a series or a very long film. The evidence graph and the story workflow hold both routes to their instructions.

### Strategy in skills, tactics in contracts

A task skill gives direction, and contracts ask the detailed questions. Contracts stay few, with one broad item per theme and the detail in statements, as [contract design](contract-design.md#items-and-statements) defines.

### Stills only

The agent sees pictures only as still images and cannot hear. No shipped instruction asks it to watch playback, listen or read aloud; it judges motion on dense consecutive frames and asks the user for the rest.

## Root and scaffold

A rule that holds in every project lives in a root skill and ships through a `$` placeholder, at file or folder level, under the [shared skill](../prompting/SKILL.md#shared-skills) rule. The scaffold keeps text of its own only where a production's stance differs from this repository's, for example because a production installs a package this repository develops.

Keep the scaffold production-neutral and usable without repository operating skills. Work-specific genre, language, voice and delivery decisions belong to the production's own instructions, project context or work contracts.

## Design from the commissioned result

Design task guidance and its contract items around the same commissioned result. Start with the user's goal and the actual authoring or production failure, and distinguish a rule the agent missed from a result the current rules permit.

Repair application and evidence when an existing item already covers the loss, and change the design when the needed judgment is absent or contradictory.

Compliant records cannot substitute for a usable film, so connect each observed failure back to the author or production owner that can repair it.

## Boundaries

Use the production [task router](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) and [story router](../../../packages/template/scaffold/instructions/.agents/skills/story/SKILL.md) to find actual owners rather than copy their layer definitions here.

Upstream novel workflows can inform ownership and review, but prose interiority, mobile reading, serial rewards and their distribution commands do not define film production.

Hand the change to [scaffold](../scaffold/SKILL.md) for distribution and project ownership checks, and implementation to [development](../development/SKILL.md). This skill adds no creative pass, graph stage, publication authority or automatic migration of existing productions.
