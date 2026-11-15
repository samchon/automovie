---
name: scaffold-prompting
description: Owns the design of what AutoMovie productions receive, namely the product principles every shipped skill serves, task strategy, contracts with their statements, and the relation between repository skills and the scaffold. Use when adding, revising or auditing scaffold instructions; prompting owns what makes an instruction work and scaffold owns distribution.
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

A shipped instruction leaves every exchange, outcome and reaction to the [screenplay](../../../packages/template/scaffold/instructions/.agents/skills/story/layers/screenplay.md) and never lets code or a generation model's prompt choose one.

### Reuse

A shipped instruction sends a production to its installed packages first and varies a module rather than copying it, as the production's [reuse](../../../packages/template/scaffold/instructions/.agents/skills/development/reuse.md) rules set.

### Two story routes

The product contract sets the [two routes](../project/SKILL.md#commissions), and the production's [route choice](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/SKILL.md#choosing-the-route) decides which a work takes.

### Skills and contracts

Shipped task skills and contracts follow prompting's [skills and contracts](../prompting/SKILL.md#skills-and-contracts) rule.

### Stills only

No shipped instruction asks the agent to watch playback, listen or read aloud; the production's [observation rule](../../../packages/template/scaffold/instructions/AGENTS.md#what-you-can-observe) says what it sees and does instead.

## Repository and scaffold

A rule that holds in every project lives in a repository skill and ships through an empty `$` placeholder in the scaffold, as [shared items](../scaffold/SKILL.md#shared-items) defines. The scaffold keeps text of its own only where a production's stance differs from this repository's, for example because a production installs a package this repository develops. Keep the scaffold production-neutral and usable without repository operating skills; a work's genre, language, voice and delivery decisions belong to [what a production owns](../scaffold/SKILL.md#what-a-production-owns).

## The commissioned output

Design task guidance and its contract items around the same commissioned output, starting from the user's goal and the failure case prompting's [verification](../prompting/SKILL.md#verification) keeps. Decide whether the agent missed a rule or the current rules permit that failure. When an existing contract item already covers the failure, repair how that item is applied and answered; change the design only when the needed judgment is absent or contradictory. Compliant records cannot substitute for a usable film, so connect each observed failure back to its repair owner.

## Boundaries

Use the production [task router](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) and [story router](../../../packages/template/scaffold/instructions/.agents/skills/story/SKILL.md) to find actual owners rather than copy their layer definitions here.

Workflows borrowed from serial-novel writing can inform ownership and review, but their prose interiority, mobile reading, serial rewards and publishing commands do not apply to film production.

This skill adds no authoring step, no Evidence graph stage and no permission to publish.
