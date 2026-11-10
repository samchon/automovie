---
name: development
description: Repairs, implements, tests, and validates automovie source, tests, workflows, and package wiring. Use before editing any of them; checklist answers belong to contracts and visual verification to 3d-modeling.
---

# Development

The rules on this page hold for every change to source, tests, workflows and package wiring. Each task adds its guide:

| Task | Read |
| --- | --- |
| Changing existing behavior | [Repair](repair.md) |
| Adding or changing tests | [Testing](testing.md) |
| Running checks or finishing a change | [Validation](validation.md) |

## Contracts

Every maintained declaration answers, in its doc comment, the checklists its package selects, always including `common.md`; the [contracts](../contracts/SKILL.md) table says which declaration answers which.

`human` selects none until its rebuild declares completion, then its production checklists at once.

## Types and files

Annotate the type of every variable and parameter and the return type of every function. Leave a type to inference only where TypeScript takes no annotation, such as a `for...of` or `catch` binding.

A source file has fewer than 500 lines and exports one symbol named after it, barrels excepted.

## Comments and layout

Write code for the agent who changes it next. Give every declaration a JSDoc comment written to the contracts [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) question, including in a package that selects no checklist.

Inside a body, separate the logical steps with blank lines so each step reads as one paragraph of code. Open each step whose purpose the code does not make obvious with a comment saying what it does and why.

A comment gives the intent, premise, or reason the code cannot show, not a paraphrase of the code. Precede every comment inside a block with a blank line unless it opens the block, so a comment never sits directly under code.

## Packages

Respect the [package boundaries](../project/SKILL.md#packages); review reads every new import and dependency against them. A public producer lands with its consumer, because test-only reach is not wiring.

`interface` is pure types with no runtime dependency. It uses plain `string` and `number` without wrapper aliases or `typia` tags, states units and ranges in JSDoc for `engine` validators to enforce, and constrains structure only through closed `AutoMovie*` unions.

## Specification

Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Scripts and shared checkouts

### Tracked code

Write every helper script in TypeScript as a tracked file and run it with `ttsx`. Keep all program code, tests and tools in tracked paths and use gitignored paths for captured evidence and data, because an ignored file escapes review and cannot be recovered.

Run an experiment as a tracked test, through a package's tracked debug tool, or as a type check.

### Processes

End every process you start for one result once that result is read. A shared server or type-check watch keeps running for every agent.

A package's viewer runs as one server that every agent shares. Request one frame at a time, and restart the server only when its status shows an empty queue, because a restart drops every frame in flight and a second server competes for the same memory and CPU.

### Several agents in one checkout

Give each agent its own scratch directory, delete only inside its own directory, and commit with `git add` then `git commit --only <paths>`. A shared index lets one commit sweep another agent's files, and a recursive delete can wipe every agent's scratch.
