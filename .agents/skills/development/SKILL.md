---
name: development
description: Repairs, implements, tests, and validates automovie source, tests, workflows, and package wiring. Use before editing any of them; checklist answers belong to contracts and visual verification to 3d-modeling.
---

# Development

## Repair

Before editing, group every known symptom by cause, then trace each cause, and your change, through callers and consumers (generated-project scripts and the viewer's projection of engine output included), error and recovery paths, caching and determinism, and Windows and POSIX. Cover each resulting case with a test, fix the owner, and delete the compensations the fix makes unnecessary. A failure that returns after each patch means the design is wrong.

## Code

- Review every new import and dependency against the [package boundaries](../project/SKILL.md#packages); nothing else enforces them.
- `interface` is pure types with no runtime dependency: plain `string` and `number`, no wrapper aliases or `typia` tags, units and ranges in JSDoc enforced by `engine` validators, and closed `AutoMovie*` unions as the only structural constraint.
- A source file has at most 500 lines and exports one symbol named after it, barrels excepted. Split by responsibility, never by compressing code or moving logic into data; an existing oversized file is a violation, not a precedent.
- A public producer lands with its consumer, a README or shipped-skill entry, or `@publicUnconsumed <planned consumer>: <reason>`; test-only reach is not wiring.
- Make a new or changed lint rule, evidence selector, or CI gate fail on an invalid input before trusting it.
- When a transform seems ignored on correct source, look for stale emitted JavaScript beside it.
- Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification; change them only on request or for a product reason, and say so.

## Tests

| Kind | Location |
| --- | --- |
| Unit | `test/src/features/<domain>/test_<name>.ts` exporting `test_<name>`, run by `@nestia/e2e`'s `DynamicExecutor` |
| Shared helper | `test/src/features/internal/` |

- There is no E2E layer; [testing.md](../contracts/testing.md) owns what a test may run.
- Compare floats with `TestValidator.predicate` over `nclose`, `vclose`, or `qclose`, never deep equality.
- A test's JSDoc states what it pins, then a numbered `Scenarios:` list, then its checklist answers.
- Every executable position on a line a change writes is exercised by a test. No coverage tool checks this; the reviewer reads the diff beside its tests.

## Validation And CI

- Prove the change with the narrowest test that fails without it (`pnpm test --include <name>`), type-check with `pnpm --filter @automovie/test build`, and let CI run the full suites.
- Run `pnpm run format` only at a pull request's final preparation for merge.
