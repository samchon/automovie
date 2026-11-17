# Validation

The checks to run on a change, and how to run them beside other agents.

## Type checking

Use one shared `pnpm ttsc --watch` process in `test/` and read its completed cycles from the same log. Start it only when none runs, because duplicate checkers compete for the plugin cache and CPU without extending coverage. In a coordinated task, its owner starts the process and gives every worker the log path.

The test tsconfig already disables emit. This watch checks the sources its program reaches; report a page or subject module outside that program as unchecked unless the task authorizes its separate validation. Do not start another compiler, build or checking helper to repeat the shared check.

### Shared verification rounds

Finish the inspection round before fixing findings: collect the completed watch cycle, relevant tests and any renders or logs, then group every finding by cause and contributing factors. Apply the whole coordinated batch before reading the next complete round, because reacting to intermediate saves repeats checks on an unfinished migration.

Coordinate changed exports and their readers in the same batch, checking remaining uses and name collisions before writing. Keep dependent tests and captures paused while that batch is incomplete; an intermediate diagnostic is not a new review round.

## Tests

Follow any task-specific test-code prohibition and use its required verification instead. Where tests are permitted, prove a change first with the narrowest test that fails without it, then run the affected tests, and let CI run the full suites.

Put every test one run needs into one `pnpm test --include <names...>`, because each run compiles the whole project before its first test.

### Bundled runs

While developing, run selected tests with `pnpm test:esbuild --include <names...>` from the root instead. It bundles the test program and the packages' sources with esbuild, starts in seconds, and builds into its own `test/bin/<process id>`, removed at the end, so runs may overlap in one checkout.

It checks no types and runs no lint, so read the type-check watch first, and keep every test valid under `pnpm test`, which CI runs.

In the bundle `__dirname` is the built file's directory and a computed `require` cannot resolve. A test that finds the repository from its own `__dirname`, or reaches a source that requires a computed path, therefore runs only under `pnpm test`.

## Visual changes

Verify a render, viewer or capture change under [visual debugging](../visual-debugging/SKILL.md).

## Formatting

At a pull request's final preparation for merge, run `pnpm exec prettier --write <changed-files>` once, on only your changed files that the repository's `format` patterns match. Skip when none match, and fix later defects without repeating the pass or rewriting unrelated files.
