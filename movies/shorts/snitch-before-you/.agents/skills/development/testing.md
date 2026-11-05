# Testing

Give each module pure-logic unit tests for its behavioral contract. Supply explicit in-memory inputs and dependencies, observe deterministic outputs or state transitions, and take expectations and tolerances from the request, physical requirements or an independent reference. Cover the module's meaningful input boundaries, timing, state, numerical error and failure conditions. Installed packages own their validation APIs.

Verify integration through the actual consumer separately, keeping Viewer playback, visual and listening judgments in [review](../review/SKILL.md). A source pattern or output copied into expectations does not supply an independent oracle. A unit test establishes its observed logic, while the real host establishes the rendered or heard result.

Test generated geometry as 3D modeling's [Crafting](../3d-modeling/crafting.md#tests) describes.

Put cases in `test/features/<source path>/test_<name>.ts`, at the path of the source folder they test, as named exported `test_*` functions returning `void` or `Promise<void>`, with assertions from `node:assert/strict` or `TestValidator` from `@nestia/e2e`. [`test/index.ts`](../../../test/index.ts) discovers and reports them. Keep helpers outside those files or unexported. Each exported function answers the [testing checklist](../contracts/development/testing.md).

Run the pure TypeScript suite through [`tsconfig.test.json`](../../../tsconfig.test.json) with `npm test`, or select a feature with `npm test -- --include <substring>` and optionally `--exclude <substring>`. An empty suite, invalid or unmatched selection, or import or test failure leaves the run unsuccessful; report the executed cases and totals.
