---
name: development
description: Repairs, implements, tests and validates automovie source.
---

# Development

These rules hold for every change to source, tests, workflows and package wiring. Each task adds its guide:

| Read | For |
| --- | --- |
| [Repair](repair.md) | Changing existing behavior |
| [Testing](testing.md) | Adding or changing tests |
| [Validation](validation.md) | Running checks or finishing a change |

## Contracts

Every maintained declaration answers the checklists its package selects, as [contracts](../contracts/SKILL.md) sets. `human` selects none until its rebuild declares completion, then its production checklists at once.

## Source style

### Types and files

Annotate the type of every variable and parameter and the return type of every function, except where TypeScript takes no annotation, such as a `for...of` or `catch` binding.

A source file has fewer than 500 lines and exports one symbol named after it, barrels excepted.

Canonical interface object contracts and object unions use `IAutoMovie*`; scalar, literal, tuple and utility aliases use `AutoMovie*`. Qualify a name by meaning, not by the package it came from. Related members may keep concise names inside a canonical type-only namespace. Reuse an existing concept after comparing units, frames, invariants and ownership. Interface enums must be `const enum`; verify their actual consumer and emit behavior, since the keyword alone does not establish an empty runtime artifact.

### Comments and layout

Give every declaration a JSDoc comment written to the contracts [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, including in a package that selects no checklist.

Inside a body, separate the logical steps with blank lines, and open each step whose purpose the code does not make obvious with a comment saying what it does and why.

A comment gives the intent, premise or reason the code cannot show, never a paraphrase of the code. Precede every comment inside a block with a blank line unless it opens the block.

## Packages

Respect the [package boundaries](../project/SKILL.md#packages); review reads every new import and dependency against them. A public producer lands with its consumer, because test-only reach is not wiring.

`interface` has no runtime dependency and owns the public contracts described by the project skill. Use plain `string` and `number`, with units, frames, ranges and the actual runtime admission owner in JSDoc; validator metadata such as `typia` tags stays with that implementation. Export types explicitly. Importing implementation packages, copying dependency types or adding opaque generics does not make a contract pure.

## Specification

Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Scripts and shared checkouts

### Tracked code

Write every helper script in TypeScript as a tracked file. Use `ttsx` when its checking is part of the authorized validation. A build configuration or syntax-only helper that must run without another compiler is a tracked `.mts` file run by Node itself; this does not establish type correctness.

Keep all program code, tests and tools in tracked paths, and use gitignored paths only for captured evidence and data, because an ignored file escapes review and cannot be recovered. Run an experiment as a tracked test, through a package's tracked debug tool, or as a type check.

### Processes

End every process you start for one result once that result is read. A shared server or type-check watch keeps running for every agent.

A package's viewer runs as one server that every agent shares. Request one frame at a time, and restart the server only when its status shows an empty queue, because a restart drops every frame in flight and a second server competes for the same memory and CPU.

### Several agents in one checkout

Give each agent its own scratch directory, delete only inside it, and commit with `git add` then `git commit --only <paths>`. A shared index lets one commit sweep another agent's files, and a recursive delete can wipe every agent's scratch.
