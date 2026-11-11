# Reuse

Look for a capability before writing it. This page says what each installed package is for and where its API is written, what to do when a package misbehaves or lacks something, and how a subject gets a second version or an action a second performance.

## Installed packages {#installed-packages}

Search the installed packages before writing a capability, and use what they provide. A capability written a second time in the production diverges from the package at its first repair.

The skills name installed packages by role. This table is the one place that says which package each role is and what a production uses it for:

| Role in the skills | Package | A production uses it to |
| --- | --- | --- |
| Interface package | `@automovie/interface` | Type the authored data every other package reads |
| Human package | `@automovie/human` | Prepare a person's canonical body |
| Motion vocabulary | `@automovie/motions` | Chain a person's actions and read the pose at any second |
| Engine | `@automovie/engine` | Validate the data, schedule a scene's actions and compute each film second |
| Viewer | `@automovie/viewer` | Draw the polygon man and every other form, and capture the picture |
| Renderer | `@automovie/render` | Plan the frames, cuts and encoding that the production's commands run |
| Ingest package | `@automovie/ingest` | Decode external models, motion, audio and images |
| Recovery package | `@automovie/recovery` | Recover curves from a fixed mesh so parameters can drive it |
| Evidence package | `@automovie/evidence` | Configure the check that code and writing answer their contracts |
| Command-line tool | `automovie` | Create, add and sync productions |

The first six rows follow a film from authored data to encoded video, and [how the parts work together](source-layout.md#how-the-parts-work-together) says how the production's modules carry them.

### Reading a package {#reading-a-package}

A package's README, public types and JSDoc are its API. Read them in the package's folder under `node_modules` instead of recalling a call, because the packages change between releases. Read the README first for what the package owns, then the declaration and JSDoc of each export you use for its units, limits and refusals.

### A defect or a gap

A production cannot repair an installed package. An edit under `node_modules` or a vendored copy disappears at the next install and hides the defect from every other production.

When a package misbehaves or lacks something the work needs:

1. Hand the user the failing case, its numbers and the installed package version, for the issue tracker the package's `repository` field names.
2. Continue with the work that does not depend on it.
3. Where the work cannot wait, use a local substitute that is marked as one and names the report it waits on.
4. Remove the substitute when the package ships the fix.

A workspace's own `packages/<name>` is the exception: the workspace owns that code and repairs it in place.

## One module, many uses {#one-module}

Every object and motion is a module the films reuse. A different version of a subject, such as a taller fighter or a second referee, or a different performance of an action, such as a tired walk, is the same module with other parameters or another seed, never a copy with edited constants, because a repair reaches only one copy.

When one needs something the module cannot express, give the module that parameter. [Shared modules](source-layout.md#shared-modules) covers a module a second production needs.
