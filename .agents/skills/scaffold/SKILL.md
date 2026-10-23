---
name: scaffold
description: Maintains the generated-project scaffold under packages/template and routes production-content work to each production's own instructions. Use before editing packages/template, and before reading, authoring, or reviewing production content anywhere, repository fixtures and sandboxes included.
---

# Scaffold

A production's own `AGENTS.md`, `README.md`, and source own its meaning; read them and the installed package APIs before interpreting, authoring, or reviewing it. Repository instructions never override them.

- The scaffold owns its production skills, contracts, and `docs/guides`; they describe making a production, not developing this repository. Read its [guide](../../../packages/template/scaffold/docs/guides/production.md) before changing that workflow. Installed package APIs own API documentation; the scaffold does not duplicate them.
- The [instruction synchronizer](../../../packages/template/build/syncScaffoldInstructions.ts) mirrors only `development/repair.md` and `documentation/writing.md`. These copies are ignored by git and regenerated on `prepare` and `build`, so edit their repository sources and keep repository-only rules outside them. A newly shared path must also enter the root `.gitignore`.
- When retiring a mirror, remove its old generated files from existing checkouts before packaging; untracked files under `scaffold` can still ship.
- Installation is one-way: installed files belong to the production, and package upgrades never overwrite them.
- For changed installation behavior, observe a generated project's installed entry point and its `lint`, `evidence`, and `test` commands.
