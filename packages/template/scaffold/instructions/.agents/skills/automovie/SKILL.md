---
name: automovie
description: Maps each production need onto the installed AutoMovie package that provides it.
---

# AutoMovie packages

Find the installed package that owns the capability and read its API before writing code.

## Packages

| Package | Role in the skills | Provides |
| --- | --- | --- |
| `@automovie/archetypes` | Archetypes | An object people use, with its affordances |
| `@automovie/engine` | Engine | Validation, scheduling and film time |
| `@automovie/evidence` | Evidence package | The check of contract answers |
| `@automovie/human` | Human package | A person's body |
| `@automovie/ingest` | Ingest package | Decoding external models and media |
| `@automovie/interface` | Interface package | The types of authored data |
| `@automovie/motions` | Motion vocabulary | What each person or group does |
| `@automovie/recovery` | Recovery package | Curves recovered from a fixed mesh |
| `@automovie/render` | Renderer | Drawing, inspection, capture and encoding |
| `@automovie/viewer` | Viewer | The picture on a page, with playback |
| `automovie` | Command-line tool | Creating productions and running commands |

The skills use package roles from the table. [Entity work](../development/entities.md#objects) defines affordances.

## Reading a package

Read the installed README for entry points and the public types and JSDoc under `node_modules` for units, limits, refusals and what each value and default performs.

Use the installed function or primitive that performs the work. If the API lacks a capability or its JSDoc omits a measure the choice depends on, such as a pace's speed, inspect the owning package's `src/` next to its installed `package.json`. If source is absent, use the repository named in that manifest at the installed version's revision. Follow the nearest implementation's frames, units, ownership and validation conventions when extending it. Send reusable gaps to the package owner.
