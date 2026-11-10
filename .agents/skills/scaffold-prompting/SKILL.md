---
name: scaffold-prompting
description: Owns the design of what AutoMovie productions receive, namely the product principles every shipped skill serves, task strategy, contracts with their statements, and the relation between root skills and the scaffold. Use when adding, revising or auditing scaffold instructions; prompting owns what makes an instruction work and scaffold owns distribution.
---

# Scaffold prompting

This skill owns the design of what productions receive. It builds on [prompting](../prompting/SKILL.md) for what makes an instruction work and on the documentation [writing rules](../documentation/writing.md) for how text is written, and repeats neither.

| Task | Read |
| --- | --- |
| Change a strategy, a responsibility or a route | [Task design](design.md) |
| Change a question, its statements or its judgment boundary | [Contract design](contracts.md) |
| Find a primary source for a new instruction | [Primary research routes](references.md) |
| Check the change before reporting it | [Verification](verification.md) |

## Product principles {#product-principles}

Every shipped skill serves these six principles, and a shipped sentence that works against one is a defect. The [project contract](../project/SKILL.md) fixes the product's purpose and scope beside them.

### Coarse models, detailed motion

A production's person is the polygon man, every other model is the simplest form that identifies it, and motion is authored in detail. Detail is an option switched on for a delivery, while development stays on the coarse form, because a hint's look comes from diffusion and its value from motion.

### The screenplay carries the detail

The screenplay decides every exchange, outcome and reaction, and a film composes APIs along it. Every object and motion is a reusable module varied by parameters and seed, never by a copied variant, and a module several productions use moves to the workspace's shared packages.

### Installed capability is reused

A production composes what its installed packages provide and writes only what they lack. It cannot repair an installed package, so a defect goes to the upstream tracker through the user.

### Two story routes

A short runs brief → screenplay. Long work, for a series or a very long film, runs settings → treatments → scripts → screenplay. The evidence graph and a strong workflow hold both to their instructions.

### Strategy in skills, tactics in contracts

A task skill gives direction, and contracts ask the detailed questions. Contracts stay few, with one broad item per theme and the detail in statements, as [contract design](contracts.md#items-and-statements) defines.

### Stills only

The agent sees pictures only as still images and cannot hear. No shipped instruction asks it to watch playback, listen or read aloud; it judges motion on dense consecutive frames and asks the user for the rest.

## Root and scaffold {#root-and-scaffold}

A rule that holds in every project lives in a root skill and ships through a `$` placeholder, at file or folder level, under the [shared skill](../prompting/SKILL.md#shared-skills) rule. The scaffold keeps text of its own only where a production's stance differs from this repository's, for example because a production installs a package this repository develops.

Keep the scaffold production-neutral and usable without repository operating skills. Work-specific genre, language, voice and delivery decisions belong to the production's own instructions, project context or work contracts.

## Design from the commissioned result

Design task guidance and its quality questions around the same commissioned result. Start with the user's goal and the actual authoring or production failure, and distinguish a rule the agent missed from a result the current rules permit.

Repair application and evidence when an existing question already covers the loss, and change the design when the needed judgment is absent or contradictory. A new symptom does not automatically need a new question.

Compliant records cannot substitute for a usable film, so connect each observed failure back to the author or production owner that can repair it.

## Boundaries

Use the production [task router](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) and [story router](../../../packages/template/scaffold/instructions/.agents/skills/story/SKILL.md) to find actual owners rather than copy their layer definitions here.

Upstream novel workflows can inform ownership and review, but prose interiority, mobile reading, serial rewards and their distribution commands do not define film production.

Hand the change to [scaffold](../scaffold/SKILL.md) for distribution and project ownership checks, and implementation to [development](../development/SKILL.md). This skill adds no creative pass, graph stage, publication authority or automatic migration of existing productions.
