# Reuse

What each installed package is for and where its API is written, what to do when a package misbehaves or lacks something, and how a subject or an action gets another version without a copy.

## Installed packages

Search the installed packages before writing a capability, and use what they provide, because a capability written again in the production diverges from the package at its first repair.

The skills name installed packages by role. This table is the one place that says which package each role is and what a production uses it for:

| Role in the skills | Package | A production uses it to |
| --- | --- | --- |
| Interface package | `@automovie/interface` | Type the authored data every other package reads |
| Human package | `@automovie/human` | Prepare a person's canonical body |
| Archetypes | `@automovie/archetypes` | Build the objects people hold, use, sit on, ride and fight with, each with the affordances a person's action attaches to |
| Motion vocabulary | `@automovie/motions` | Compose what each person does, register an action it lacks, and read and check the performance at any second |
| Engine | `@automovie/engine` | Validate the data, schedule a scene's actions and compute each film second |
| Viewer | `@automovie/viewer` | Mount the picture on a page, play it back and review it |
| Renderer | `@automovie/render` | Draw the polygon man and every other form, inspect and capture the picture, and plan the frames, cuts and encoding that the production's commands run |
| Ingest package | `@automovie/ingest` | Decode external models, motion, audio and images |
| Recovery package | `@automovie/recovery` | Recover curves from a fixed mesh so parameters can drive it |
| Evidence package | `@automovie/evidence` | Configure the check that code and writing answer their contracts |
| Command-line tool | `automovie` | Create and add productions, and run the capture, render and review commands |

The first seven rows follow a film from authored data to encoded video; [how the parts work together](source-layout.md#how-the-parts-work-together) says how the production's modules carry it.

### Reading a package

A package's public types and JSDoc are its API, and they change between releases, so read them in the package's folder under `node_modules` instead of recalling a call. Read the README first for what the package owns, then the declaration and JSDoc of each export you use for its units, limits and refusals.

### A defect or a gap

A production cannot repair an installed package: an edit under `node_modules` or a vendored copy disappears at the next install and hides the defect from every other production. When a package misbehaves or lacks something the work needs:

1. Give the user the failing case, its numbers and the installed version, for the tracker the package's `repository` field names.
2. Continue with the work that does not depend on it.
3. Where the work cannot wait, use a local substitute marked as one, naming the report it waits on.
4. Remove the substitute when the package ships the fix.

A workspace's own `packages/<name>` is the exception: the workspace owns that code and repairs it in place.

A row or law registered with the motion vocabulary under [vocabulary extension](../motion/laws/extension.md) is not a substitute. Registration is the vocabulary's own way to take an action it lacks, so it needs no mark and stays.

## One module

Every object and motion is a module the films reuse. Another version of a subject, such as a taller fighter or a second referee, or another performance of an action, such as a tired walk, is the same module with other parameters or another seed, never a copy with edited constants, because a repair reaches only one copy.

When a version needs something the module cannot express, give the module that parameter. [Shared modules](source-layout.md#shared-modules) covers a module a second production needs.
