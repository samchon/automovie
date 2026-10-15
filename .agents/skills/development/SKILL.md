---
name: development
description: Repairs, implements, tests, and validates automovie source, tests, workflows, and package wiring. Use before editing any of them; acknowledgments belong to contracts and visual verification to 3d-modeling.
---

# Development

## Contracts

Every maintained declaration answers, in its doc comment, the [contracts](../contracts/SKILL.md) checklists its package selects. Production types and functions select [`common.md`](../contracts/common.md) and [`performance.md`](../contracts/performance.md), except in `interface`, which selects only `common.md`. Tests select [`testing.md`](../contracts/testing.md). `human` selects none until its rebuild declares completion, then both production checklists at once.

## Types And Files

Annotate the type of every variable and parameter and the return type of every function. Leave a type to inference only where TypeScript takes no annotation, such as a `for...of` or `catch` binding.

A source file has at most 500 lines and exports one symbol named after it, barrels excepted.

## Packages

Respect the [package boundaries](../project/SKILL.md#packages); review reads every new import and dependency against them. A public producer lands with its consumer, because test-only reach is not wiring.

`interface` is pure types with no runtime dependency. It uses plain `string` and `number` without wrapper aliases or `typia` tags, states units and ranges in JSDoc for `engine` validators to enforce, and constrains structure only through closed `AutoMovie*` unions.

## Specification

Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Task Guides

- Read [Repair](repair.md) when changing existing behavior.
- Read [Testing](testing.md) when adding or changing tests.
- Read [Validation](validation.md) before running checks or finishing a change.
