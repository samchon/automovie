# Validation

## Tests

Prove a change first with the narrowest test that fails without it (`pnpm test --include <name>`). Then run the affected tests locally and let CI run the full suites.

## Visual Changes

Verify a render or viewer change under the 3D modeling skill's [Visual Debugging](../3d-modeling/visual-debugging.md).

## Formatting

Run `pnpm run format` once, at a [pull request](../pull-request/SKILL.md)'s final preparation for merge, and fix any later defect without running it again.
