# Validation

The checks to run on a change, and how to run them beside other agents.

## Type checking

Read type errors from the running watch of the program that compiles the code, and start one only where none runs. `pnpm ttsc --noEmit --watch` in `test/` checks every package the tests import. Code outside that program, such as a page or subject module a package builds only for the shared inspection instrument, has its own watch under its own tsconfig, documented beside that code.

Every agent in the checkout reads the running watch's log, because a second watch over the same program competes for the plugin cache and CPU and finds nothing more.

### Saving under a shared watch

Each save must compile on its own, because the watch checks every intermediate save and a red build blocks every other agent's tests and captures.

- Save a new module before the files that import it.
- Write a structural rewrite as one complete file.
- Update every reader of a changed export in the same batch.
- Before a save that removes or renames an identifier, search the file and its importers for every remaining use.
- Before a save that adds one, search the target scope for a name it would collide with.
- After every save, read the next watch cycle before editing or running anything else.

## Tests

Follow any task-specific test-code prohibition and use its required verification instead. Where tests are permitted, prove a change first with the narrowest test that fails without it, then run the affected tests, and let CI run the full suites.

Put every test one run needs into one `pnpm test --include <names...>`, because each run compiles the whole project before its first test.

While developing, run selected tests with `pnpm test:esbuild --include <names...>` from the root instead. It bundles the test program and the packages' sources with esbuild and starts in seconds. It checks no types and runs no lint, so read the type-check watch first, and keep every test valid under `pnpm test`, which CI runs. Each run builds into its own `test/bin/<process id>` and removes it at the end, so runs may overlap in one checkout. In the bundle `__dirname` is the built file's directory and a computed `require` cannot resolve, so a test that finds the repository from its own `__dirname`, or reaches a source that requires a computed path, runs only under `pnpm test`.

## Visual changes

Verify a render, viewer or capture change under [visual debugging](../visual-debugging/SKILL.md).

## Formatting

At a [pull request](../pull-request/SKILL.md)'s final preparation for merge, run `pnpm exec prettier --write <changed-files>` once on only your changed files matched by the repository's `format` patterns. Skip when none match, and fix later defects without repeating the pass or rewriting unrelated files.
