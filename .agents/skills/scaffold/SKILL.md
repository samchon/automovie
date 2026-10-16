---
name: scaffold
description: Maintains the generated-project scaffold under packages/template and routes production-content work to each production's own instructions. Use before editing packages/template, and before reading, authoring, or reviewing production content anywhere, repository fixtures and sandboxes included.
---

# Scaffold

A production's own `AGENTS.md`, `README.md`, and source own its meaning; read them and the installed package APIs before interpreting, authoring, or reviewing it. Repository instructions never override them.

- The [instruction synchronizer](../../../packages/template/build/syncScaffoldInstructions.ts) owns which repository 3d-modeling guides and common contract are copied into the scaffold; edit their repository sources and regenerate the copies with that helper.
- Installation is one-way: installed files belong to the production, and package upgrades never overwrite them.
- For changed installation behavior, observe a generated project's installed entry point and its `lint` and `evidence` commands.
