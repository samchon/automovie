# Verification

Apply [instruction verification](../prompting/verification.md) to production tasks and their consumers.

## Distribution

Inspect the file map, substitutions and expanded shared files in the [implementation of `AutoMovieTemplateScaffold.create`](../../../packages/template/src/scaffold/internal/create.ts). Untracked scaffold files ship.

Ship [shared rules](../prompting/structure.md#shared-skills) through empty `$` placeholders. Keep scaffold-owned text for production rules. Use production-relative paths and local skill links within `.agents`.

When a skill has supporting documents, use `SKILL.md` as their contents page. Link from each overview to the applicable details.

Keep scaffold lint independent of folders. Keep engineering checks enabled when productions opt into narrative Evidence.

Use development checks for program behavior. For installation changes, run the installed entry point and `lint`, `evidence` and `test` in a generated project.

To update an existing production with authorization, compare its files with the scaffold and preserve local choices, contracts and repairs. Apply its own rules to affected answers and reviews. Verify any changed approval conditions.

## Behavior

For a changed expression criterion, test an informative but ineffective passage and a deliberate restrained form against [creation and judgment](task-design.md#creation-and-judgment). Check that the item catches what independent classification misses.

Report which media results were observed.
