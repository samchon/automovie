# Reuse

Look for a capability before writing it. These rules also decide what to do when an installed package misbehaves or lacks something, and when a subject needs a second version or an action a second performance.

## Installed packages {#installed-packages}

Search the installed packages before writing a capability, and use what they provide: their READMEs, public types and JSDoc say what exists. A capability written a second time in the production diverges from the package at its first repair.

The skills name installed packages by role, and this table is the one place that says which package each role is:

| Role in the skills | Package |
| --- | --- |
| Motion vocabulary | `@automovie/motions` |
| Human package, which prepares the canonical body | `@automovie/human` |
| Viewer, which draws the polygon man | `@automovie/viewer` |
| Engine | `@automovie/engine` |
| Evidence package | `@automovie/evidence` |
| Renderer | `@automovie/render` |
| Command-line tool | `automovie` |

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
