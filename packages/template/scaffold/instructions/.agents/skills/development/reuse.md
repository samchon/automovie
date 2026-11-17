# Reuse

What each installed package is for and where its API is written, what to do when a package misbehaves or lacks something, and how a subject or an action gets another version without a copy.

## Installed packages

The [production principles](../../../AGENTS.md#principles) choose the bodies, objects and human motion. Read the installed capabilities before connecting them. A capability written again in the production diverges from the package at its first repair.

The skills refer to the installed packages by these roles; their public declarations own the calls:

| Role in the skills | Package | A production uses it to |
| --- | --- | --- |
| Interface package | `@automovie/interface` | Type the authored data every other package reads |
| Human package | `@automovie/human` | Prepare a person's canonical body |
| Archetypes | `@automovie/archetypes` | Build the objects people hold, use, sit on, ride and fight with, each with the affordances a person's action attaches to |
| Motion vocabulary | `@automovie/motions` | Compose what each person does, register an action it lacks, and read and check the performance at any second |
| Engine | `@automovie/engine` | Validate data, schedule actions and evaluate film time; additional physical solving follows physical feedback |
| Viewer | `@automovie/viewer` | Mount the picture on a page, play it back and review it |
| Renderer | `@automovie/render` | Draw the polygon man and every other form, inspect and capture the picture, and plan the frames, cuts and encoding that the production's commands run |
| Ingest package | `@automovie/ingest` | Decode external models, motion, audio and images |
| Recovery package | `@automovie/recovery` | Recover curves from a fixed mesh so parameters can drive it |
| Evidence package | `@automovie/evidence` | Configure the check that code and writing answer their contracts |
| Command-line tool | `automovie` | Create and add productions, and run the capture, render and review commands |

### Reading a package

A package's public types and JSDoc are its API, and they change between releases, so read them in the package's folder under `node_modules` instead of recalling a call. Read the README first for what the package owns, then the declaration and JSDoc of each export you use for its units, limits and refusals.

### A defect or a gap

A production cannot repair an installed package: an edit under `node_modules` or a vendored copy disappears at the next install and hides the defect from every other production. When a package misbehaves or lacks something the work needs:

1. Retain the failing inputs, measurements and installed version. Give the user the case for the tracker the package's `repository` field names.
2. Continue with the work that does not depend on it.
3. Identify the blocked requirement and apply the [adopted limitation](../motion/catalog-cases.md#adopted-limitations) or alternative. An unresolved scope decision goes to the user.
4. Keep any explicitly chosen temporary substitute marked with its report and remove it when the package ships the fix. A faulty existing action is not a missing action to reimplement as a new law.

A task that includes developing a workspace's own `packages/<name>` repairs that code in place. Access to its source does not add SDK development to a film commission.

A registered [extension](../motion/laws/extension.md) for a genuinely missing action is a production capability, not a temporary substitute.

## One module

Each subject or action has one definition. Represent other versions with parameters or the seed so repairs reach them together.

When a version needs something the module cannot express, give the module that parameter. [Shared modules](source-layout.md#shared-modules) covers a module a second production needs.
