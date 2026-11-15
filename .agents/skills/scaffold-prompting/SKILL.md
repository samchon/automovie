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

Every shipped skill serves these six principles, and a shipped sentence that works against one is a defect. The [product contract](../project/SKILL.md#product-contract) fixes the product's purpose and scope; each principle here says what that means for a shipped instruction.

### Coarse models, detailed motion

The product contract sets [coarse models and detailed motion](../project/SKILL.md#coarse-models-detailed-motion). A shipped skill therefore never asks for surface detail to make a scene work: a hint's appearance comes from diffusion and its value from motion.

### Screenplay detail

The screenplay decides every exchange, outcome and reaction, and a film's code stages each one in screenplay order.

### Reuse

A production composes what its installed packages provide and writes only what they lack. It cannot repair an installed package, so a defect goes to the upstream tracker through the user.

Every object and motion a production writes is a reusable module varied by parameters and seed, never a copied variant, and a module several productions use moves to the workspace's shared packages.

### Two story routes

The product contract sets the [two routes](../project/SKILL.md#commissions): a short film, and long-form work for a series or a very long film. The evidence graph and the story workflow route each to its own instructions.

### Skills and contracts

A shipped task skill gives direction and its contracts ask the detailed questions, under prompting's [skills and contracts](../prompting/SKILL.md#skills-and-contracts) rule.

### Stills only

The agent sees pictures only as still images and cannot hear. No shipped instruction asks it to watch playback, listen or read aloud; it judges motion on dense consecutive frames and asks the user for the rest.

## Root and scaffold

A rule that holds in every project lives in a root skill and ships through an empty `$` placeholder in the scaffold, as [shared items](../scaffold/SKILL.md#shared-items) defines. Such a skill follows prompting's [shared skill](../prompting/SKILL.md#shared-skills) rule. The scaffold keeps text of its own only where a production's stance differs from this repository's, for example because a production installs a package this repository develops.

Keep the scaffold production-neutral and usable without repository operating skills. Work-specific genre, language, voice and delivery decisions belong to the production's own instructions, project context or work contracts.

## The commissioned result

Design task guidance and its contract items around the same commissioned result, starting from the user's goal and the failure case prompting's [verification](../prompting/SKILL.md#verification) keeps. Decide whether the agent missed a rule or the current rules permit that failure. When an existing item already covers it, repair how it is applied and evidenced; change the design only when the needed judgment is absent or contradictory.

Compliant records cannot substitute for a usable film, so connect each observed failure back to its repair owner.

## Boundaries

Use the production [task router](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) and [story router](../../../packages/template/scaffold/instructions/.agents/skills/story/SKILL.md) to find actual owners rather than copy their layer definitions here.

Workflows borrowed from serial-novel writing can inform ownership and review, but their prose interiority, mobile reading, serial rewards and publishing commands do not apply to film production.

Hand the change to [scaffold](../scaffold/SKILL.md) for distribution and project ownership checks, and implementation to [development](../development/SKILL.md). This skill adds no creative pass, graph stage or publication authority.
