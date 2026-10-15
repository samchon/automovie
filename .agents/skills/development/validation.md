# Validation

Prove a change first with the narrowest test that fails without it (`pnpm test --include <name>`), then run the affected tests locally and let CI run the full suites. Verify a render or viewer change under the [3D modeling skill](../3d-modeling/SKILL.md#visual-debugging).

Run `pnpm run format` once, at a [pull request](../pull-request/SKILL.md)'s final preparation for merge. Fix any later defect without running it again.
