---
name: development
description: Repairs, implements, tests and validates automovie source.
---

# Development

Apply these rules to source, tests, workflows and package wiring.

| Read | For |
| --- | --- |
| [Repair](repair.md) | Changing existing behavior |
| [Testing](testing.md) | Adding or changing tests |
| [Validation](validation.md) | Running checks or finishing a change |

## Contracts

Every maintained declaration answers the checklists its package selects, as [contracts](../contracts/SKILL.md) sets. `human` selects none until its rebuild declares completion, then its production checklists at once.

## Source style

### Types and files

Annotate variables, parameters and return types wherever TypeScript allows it.

A package source file has fewer than 500 lines and exports one symbol named after it, barrels excepted. A test file has no length limit.

Name canonical object contracts and unions `IAutoMovie*` and scalar, literal, tuple and utility aliases `AutoMovie*`. Name them by meaning. Keep type-only namespace members short. Check units, frames, invariants and ownership before reusing types. Use `const enum` for interface enums and verify their behavior in emit and at consumers.

### Comments and layout

Give every declaration a JSDoc comment written to the contracts [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, including in a package that selects no checklist.

Separate logical steps with blank lines. Explain each non-obvious step's intent or premise.

Within a block, precede each comment with a blank line unless it opens the block.

## Packages

Check all new imports and dependencies against the [package boundaries](../project/SKILL.md#packages). Ship a public producer with its consumer.

In `interface`, use plain `string` and `number` and explicitly export types. Document units, frames, ranges and the runtime admission owner. Leave validator metadata and implementation dependencies with that owner.

## Specification

Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Scripts and shared checkouts

### Tracked code

Use tracked TypeScript for helper scripts. Use `ttsx` for authorized checks. A syntax-only helper or build config that cannot depend on a compiler uses `.mts` and runs on Node.

Keep experiments in tracked tests or debug tools, or use a type check. Use ignored paths only for captured evidence and data.

### Processes

Stop one-off processes after reading their results. Preserve shared servers and checkers.

Share one viewer per package. Request one frame at a time. Restart only with an empty queue.

### Several agents in one checkout

Give each worker a separate scratch directory. Delete only within your own. Stage and commit only your paths with `git add` and `git commit --only <paths>`.
