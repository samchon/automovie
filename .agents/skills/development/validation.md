# Validation

## Tests

Follow any task-specific test-code prohibition and use its required verification instead. Where tests are permitted, prove a change first with the narrowest test that fails without it (`pnpm test --include <name>`). Then run the affected tests locally and let CI run the full suites.

## Visual Changes

Verify a render or viewer change under the 3D modeling skill's [Visual Debugging](../3d-modeling/visual-debugging.md).

## Formatting

At a [pull request](../pull-request/SKILL.md)'s final preparation for merge, run `pnpm exec prettier --write <changed-files>` once on only your changed files matched by the repository's `format` patterns. Skip when none match, and fix later defects without repeating the pass or rewriting unrelated files.
