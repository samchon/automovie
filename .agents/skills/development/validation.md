# Validation

## Type checking

Run `pnpm test:types:watch` from the repository root only when the test program has no active watch. The watch owner shares the log of completed cycles.

Reuse the no-emit test watch for its entire program. Report files outside it as unchecked unless authorized to check them separately.

### Shared verification rounds

Apply the repository's correction-round rule to the completed watch cycle, tests, renders and logs.

Batch export changes with their readers. Check uses and collisions before editing. Pause dependent tests and captures until the batch is complete.

## Tests

Follow task-specific test restrictions and any verification they require. Where tests are allowed, start with a narrow failing case, run affected tests and leave full suites to CI.

Run all needed cases together with `pnpm test --include <names...>` to compile once.

### Bundled runs

From the root, use `pnpm test:esbuild --include <names...>` for bundled development runs. Each run builds in its own `test/bin/<process id>` and removes it at exit, so runs may overlap.

It checks no types and runs no lint, so read the type-check watch first, and keep every test valid under `pnpm test`, which CI runs.

Use `pnpm test` for tests that rely on the source file's `__dirname` or a computed `require` path.

## Visual changes

Verify a render, viewer or capture change under [visual debugging](../visual-debugging/SKILL.md).

## Scaffold distribution

Check the files, substitutions and shared skills a new project receives. The installer includes untracked scaffold files.

For installation changes, verify the installed entry point and run `lint`, `evidence` and `test` in a generated project when the task permits.

Preserve local choices, contracts and repairs when updating an existing production.

## Formatting

Before merging, run `pnpm exec prettier --write <changed-files>` once on your changed files that match the repository's `format` patterns.
