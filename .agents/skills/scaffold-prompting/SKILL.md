---
name: scaffold-prompting
description: Owns the design of what AutoMovie productions receive, namely the product principles every shipped skill serves, task design, the shape and reading cost of the skill tree, contracts with their statements, research support and verification. Use when adding, revising or auditing scaffold instructions; prompting owns what makes an instruction work and scaffold owns distribution.
---

# Scaffold prompting

Scaffold prompting designs the skills, contracts and routers a production receives. It builds on [prompting](../prompting/SKILL.md) for what makes an instruction work and on the documentation [writing rules](../documentation/writing.md) for how text reads, and repeats neither.

| Task | Read |
| --- | --- |
| Design or revise a task skill, a route or a page | [Task design](task-design.md) |
| Place pages in the tree and keep a task's reading short | [Layout](layout.md) |
| Change a contract item, its statements or its judgment boundary | [Contract design](contract-design.md) |
| Find a primary source for a new instruction | [Research routes](research-routes.md) |
| Check a change before reporting it | [Verification](verification.md) |

## Product principles

Every shipped sentence serves these principles, and one that works against any of them is a defect. The [product contract](../project/SKILL.md#product-contract) fixes the product's purpose and scope.

- **Coarse models, detailed motion.** No shipped instruction makes a scene depend on surface detail. A motion hint's appearance comes from diffusion and its value from motion; detail is a delivery option, as the [product contract](../project/SKILL.md#coarse-models-detailed-motion) sets.
- **Screenplay detail.** Every exchange, outcome and reaction is decided in the [screenplay](../../../packages/template/scaffold/instructions/.agents/skills/story/layers/screenplay.md); code and generation prompts realize it and never choose one.
- **Reuse.** A production uses its installed packages first and varies a module instead of copying it, under its [reuse](../../../packages/template/scaffold/instructions/.agents/skills/development/reuse.md) rules.
- **Two story routes.** Every instruction works on the short and the long [route](../project/SKILL.md#commissions), and leaves the choice between them to the production's [route choice](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/routes.md#choosing-the-route).
- **Skills and contracts.** A skill gives the job and its boundaries; a rule every selected respondent must meet lives in a contract, as prompting's [skills and contracts](../prompting/SKILL.md#skills-and-contracts) sets.
- **Stills only.** No instruction asks the agent to watch playback, listen or read aloud; the production's [observation rule](../../../packages/template/scaffold/instructions/AGENTS.md#what-you-can-observe) says what it sees and asks the user for the rest.

## Repository and scaffold

A rule that holds in every project lives in a repository skill and ships through an empty `$` placeholder, as [shared items](../scaffold/SKILL.md#shared-items) defines. The scaffold keeps its own text only where a production's stance differs, such as a production installing a package this repository develops. Shipped text stays production-neutral: a work's genre, language, voice and delivery decisions belong to [what a production owns](../scaffold/SKILL.md#what-a-production-owns).

This skill adds no authoring step, Evidence stage or permission to publish, and it finds owners through the production's [task router](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) rather than copying their definitions.
