---
name: scaffold
description: Maintains the generated-project scaffold under packages/template and routes production-content work to each production's own instructions. Use before editing packages/template, and before reading, authoring, or reviewing production content anywhere, repository fixtures and sandboxes included.
---

# Scaffold

A production's own `AGENTS.md`, `README.md`, and source own its meaning; read them and the installed package APIs before interpreting, authoring, or reviewing it. Repository instructions never override them.

- The scaffold owns its production skills, contracts, and `docs/guides`; they describe making a production, not developing this repository. Read its [guide](../../../packages/template/scaffold/docs/guides/production.md) before changing that workflow. Installed package APIs own API documentation; the scaffold does not duplicate them. `@automovie/evidence` owns reusable evidence defaults, graph composition, and checking; the scaffold keeps one options object and a thin checker entry.
- Default lint and evidence configurations serve ordinary TypeScript development; narrative work opts into its additional workflow while retaining engineering checks. Long-form work preserves settings → treatments → scripts → final screenplay, with construction, expression revision, evidence, current independent review, and whole-work completion. Short video enters at final screenplay, and asset-only work has no narrative. Compact questions within those responsibilities rather than removing the architecture.
- The [instruction synchronizer](../../../packages/template/build/syncScaffoldInstructions.ts) mirrors only `development/repair.md` and `documentation/writing.md`. These copies are ignored by git and regenerated on `prepare` and `build`, so edit their repository sources and keep repository-only rules outside them. A newly shared path must also enter the root `.gitignore`.
- When retiring a mirror, remove its old generated files from existing checkouts before packaging; untracked files under `scaffold` can still ship.
- Installation is one-way: generated instructions, contracts, configuration, and authored files belong to the production, and package upgrades never overwrite them. Reusable package implementation stays with its package.
- For changed installation behavior, observe a generated project's installed entry point and its `lint`, `evidence`, and `test` commands.
