---
name: development
description: Repairs, implements, tests, and validates automovie source, tests, workflows, and package wiring. Use before editing any of them; acknowledgments belong to contracts and visual verification to 3d-modeling.
---

# Development

## Repair

Before editing, group every known symptom by cause, then trace each cause, and your change, through callers and consumers, error and recovery paths, caches and determinism, and Windows and POSIX. Cover each resulting case with a test, fix the owner, and delete the compensations the fix makes unnecessary.

## Contracts

Every maintained declaration answers, in its doc comment, the [contracts](../contracts/SKILL.md) checklists its package selects:

- production types and functions: [`common.md`](../contracts/common.md) and [`performance.md`](../contracts/performance.md), except `interface`, which selects only `common.md`;
- tests: [`testing.md`](../contracts/testing.md).

## Code

- Annotate the type of every variable and parameter and the return type of every function; leave a type to inference only where TypeScript takes no annotation, such as a `for...of` or `catch` binding.
- Respect the [package boundaries](../project/SKILL.md#packages); review reads every new import and dependency against them.
- `interface` is pure types with no runtime dependency: plain `string` and `number`, no wrapper aliases or `typia` tags, units and ranges in JSDoc enforced by `engine` validators, and closed `AutoMovie*` unions as the only structural constraint.
- A source file has at most 500 lines and exports one symbol named after it, barrels excepted.
- A public producer lands with its consumer; test-only reach is not wiring.
- Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Tests

| Kind | Location |
| --- | --- |
| Unit | A `test_<name>.ts` under `test/src/features/<domain>/` declaring `export function test_<name>(): void` or `export async function test_<name>(): Promise<void>`, never an arrow function, and importing the source it calls. |

- Observe through the product's seams or its own output; never replace globals or foreign methods in a test.
- Open each case with what it pins, then a numbered `Scenarios:` list. Reuse `test/src/features/internal/`.
- Compare floats with `TestValidator.predicate` over `nclose`, `vclose`, or `qclose`, never deep equality.

## Validation And CI

- Before finishing, prove the change with the narrowest test that fails without it (`pnpm test --include <name>`). Run the affected tests locally, then let CI run the full suites.
- Verify a render or viewer change under the [3D modeling skill](../3d-modeling/SKILL.md#visual-debugging).
- Run `pnpm run format` once, at a [pull request](../pull-request/SKILL.md)'s final preparation for merge; fix any later defect without rerunning it.
