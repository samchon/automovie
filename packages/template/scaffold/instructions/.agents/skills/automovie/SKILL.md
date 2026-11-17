---
name: automovie
description: Maps each production need onto the installed AutoMovie package that provides it, and says how to read a package. Use before preparing a person, an object, a motion, a picture or a command.
---

# AutoMovie packages

A production is built from the installed AutoMovie packages. Find the package for the need at hand below and read it before writing code, because a capability written again in the production diverges from the package at its first repair.

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

The skills name a package by its role. Every film uses the human package, the archetypes and the motion vocabulary, as the production principles set. Entity work defines an archetype's affordances.

## Reading a package

A package's public types and JSDoc are its API, and they change between releases, so read them in the package's folder under `node_modules` instead of recalling a call. Read the README first for what the package owns and its example, then the declaration and JSDoc of each export you use for its units, limits and refusals.

Use a package as installed. An edit under `node_modules`, a patch or a copy in the production disappears at the next install or drifts from the package.
