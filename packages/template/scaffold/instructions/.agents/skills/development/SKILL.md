---
name: development
description: Implements and tests production source, integrations, dependencies and commands, reusing installed packages before writing a capability. Use for code or host changes and behavioral tests; documentation owns technical writing and story owns creative bodies.
---

# Development

Read the production's current source and the installed package APIs before choosing an implementation. Divide behavior into responsibilities with explicit inputs, outputs and state owners, give each module [unit tests](testing.md), then verify their composition through the actual consumer.

- Read [Repair](repair.md) when changing existing behavior or fixing a defect.
- Answer the [contracts](../contracts/SKILL.md) of the declarations you change, as the [development contracts](../contracts/development/SKILL.md) map them onto the source folders.
- Read [entity work](entities.md) when building or changing a subject.
- Read [testing](testing.md) when choosing behavioral checks.
- Read [stage caches](../production/stages.md) when adding or changing an expensive stage.
- Read [source layout](layout.md) when placing source, tests or runtime setup, or adding a subject, practice or scene.
- Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md). A production module's doc comment is the next agent's manual: beyond the [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, it shows one short composition example, states the invariants it keeps, and cites what it realizes. Write instructions with [prompting](../prompting/SKILL.md). Creative bodies follow the production's adopted language, voice and form under [story contracts](../contracts/story/SKILL.md) in place of those writing rules, keeping fixed quotations and creative choices such as purposeful repetition, nonstandard speech and punctuation.

## Installed packages {#installed-packages}

Search the installed packages before writing a capability, and use what they provide: their READMEs, public types and JSDoc say what exists. A capability written a second time in the production diverges from the package at its first repair.

A production cannot repair an installed package. An edit under `node_modules` or a vendored copy disappears at the next install and hides the defect from every other production. When a package misbehaves or lacks something the work needs, hand the user the failing case, its numbers and the installed package version for the issue tracker the package's `repository` field names. Then continue with the work that does not depend on it, or with a local stand-in that is marked as one, names the report it waits on, and is removed when the package ships the fix.

A workspace's own `packages/<name>` is the exception: the workspace owns that code and repairs it in place.

## One module, many uses {#one-module}

Every object and motion is a module the films reuse. A different flavour of one, such as a taller fighter, a second referee or a tired walk, is the same module with other parameters or another seed, never a copy with edited constants, because a repair reaches only one copy. When a flavour needs something the module cannot express, give the module that parameter. A module a second production needs moves to a [workspace package](layout.md#shared-modules).

## Finish a change

While editing, keep the README's compile checker running as the single compile check and read errors from its output instead of rerunning a build. Finish a source change with the README's lint, evidence and test commands, then verify the affected consumer through [review](../review/SKILL.md): a visual change on captured stills of the affected interval, and anything only playback or listening can show by asking the user.
