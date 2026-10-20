---
name: scaffold
description: Maintains the generated-project scaffold under packages/template and routes production-content work to each production's own instructions. Use before editing packages/template, and before reading, authoring, or reviewing production content anywhere, repository fixtures and sandboxes included.
---

# Scaffold

A production's own `AGENTS.md`, `README.md`, and source own its meaning; read them and the installed package APIs before interpreting, authoring, or reviewing it. Repository instructions never override them.

- The [instruction synchronizer](../../../packages/template/build/syncScaffoldInstructions.ts) mirrors the production-neutral repository instructions it lists into the scaffold: whole skills such as 3d-modeling, and shared files beside a scaffold-owned `SKILL.md`. The copies are ignored by git and regenerated on `prepare` and `build`, so edit only the repository sources, keep repository-only rules in the repository `SKILL.md` rather than a shared file, and add a newly shared path to both that list and the root `.gitignore`.
- Installation is one-way: installed files belong to the production, and package upgrades never overwrite them.
- For changed installation behavior, observe a generated project's installed entry point and its `lint`, `evidence`, and `test` commands.
