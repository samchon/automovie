---
name: development
description: Repairs, implements, tests, and validates automovie source, tests, workflows, and package wiring. Use before editing any of them; acknowledgments belong to contracts and visual verification to 3d-modeling.
---

# Development

## Contracts

Every maintained declaration answers, in its doc comment, the [contracts](../contracts/SKILL.md) checklists its package selects:

- production types and functions: [`common.md`](../contracts/common.md) and [`performance.md`](../contracts/performance.md), except `interface`, which selects only `common.md`;
- tests: [`testing.md`](../contracts/testing.md);
- `human`: none until its rebuild declares completion, then both production checklists at once.

## Code

- Annotate the type of every variable and parameter and the return type of every function; leave a type to inference only where TypeScript takes no annotation, such as a `for...of` or `catch` binding.
- Respect the [package boundaries](../project/SKILL.md#packages); review reads every new import and dependency against them.
- `interface` is pure types with no runtime dependency: plain `string` and `number`, no wrapper aliases or `typia` tags, units and ranges in JSDoc enforced by `engine` validators, and closed `AutoMovie*` unions as the only structural constraint.
- A source file has at most 500 lines and exports one symbol named after it, barrels excepted.
- A public producer lands with its consumer; test-only reach is not wiring.
- Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Task Guides

- Read [Repair](repair.md) when changing existing behavior.
- Read [Testing](testing.md) when adding or changing tests.
- Read [Validation](validation.md) before running checks or preparing a change for CI.
