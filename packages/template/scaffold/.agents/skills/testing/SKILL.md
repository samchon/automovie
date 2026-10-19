---
name: testing
description: Decides whether and what this production tests, and writes those tests under test. Use when authoring or changing models, motion, or shots under src, or when the user or a production document fixes a number the source must meet. Script-only work has nothing to test.
---

# Testing

A test proves a fact the production promises, measured on the geometry and motion its source computes. How a result looks stays with [Visual Debugging](../3d-modeling/visual-debugging.md), never a pixel comparison.

Test only what `src` contains. A production without models, motion, or shots has no tests, and `npm test` passes with none; never add a test to fill that gap.

## What To Test

Each row applies only when `src` holds that kind of source. The functions are public `@automovie/engine` exports whose types and JSDoc give their inputs.

| Source | Test |
| --- | --- |
| A model | `validateModel` succeeds, which also checks the topology of every mesh it carries; `measureAutoMovieModelCrossings` reports no part pair the design does not intend; an intended pair, such as a top on its leg or an eyeball in its lid, appears whether it rests or sinks, so measure where it rests |
| A model with moving parts | the same checks on every extreme state the source can build, such as an open door or a raised limb |
| A shot | `compileDefinedShot` returns no diagnostics; where actors touch, step, or bear weight, `detectBodyCollision`, `validateFootSkate`, `validateGroundContact`, `validateBalanceSupport`, and `detectFreeFall` report nothing the shot does not intend |
| Consecutive shots | `validateFilmContinuity` reports no discontinuity the edit does not intend |
| A number the user or a production document fixed | the computed value meets it, measured through `measureAutoMovieGeometry` or the model's dimensions |

Several of these validators only warn, because a jump cut or a deliberate slide can be intended. Assert the absence of each warning the production does not intend, and leave intended ones unasserted.

Take every expected value from the user's request, a production document, or a physical requirement, never from the current output. A digest or subject diff shows what a change moved; it is review material, not a test.

## Writing Tests

Put each test in `test/<domain>/test_<name>.ts` and export it as `export function test_<name>(): void`, or an async function returning `Promise<void>`. [`test/index.ts`](../../../test/index.ts) runs every exported `test_*` function through `node:test`. Keep helpers unexported or outside `test_*.ts` files, because every exported function there answers the checklist. Assert with `node:assert/strict`, and compare measured floats within a tolerance stated in metres or seconds.

Each test answers the [testing checklist](../contracts/testing.md) like any other exported declaration. When a test fails, repair the source under [Repair](../development/repair.md); never loosen the expectation to pass.
