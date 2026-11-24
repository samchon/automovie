# Workspace

## References

- For geometry comparisons, use public assets with an explicit license and record the revision, exact asset identity and pose. Use primary anatomy measurements in their published frame and population.
- Keep local reference data and captures outside commits. Human source and fixtures may depend only on documented public references and published measurements.
- Keep acquisition and inspection tooling in tracked paths under development's [Scripts and shared checkouts](../development/SKILL.md#scripts-and-shared-checkouts).

## Ignored paths

`test/.shots`, `test/src/executable`, `.shots`, `.references` and `packages/human/.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. New Human captures belong in `packages/human/.shots`.

Work only in the local checkout, never in another clone or worktree, so every worker and the supervisor see one tree. Give every file write and output redirect an absolute path, because a relative one resolves against the process's own directory and lands a stray file elsewhere in the tree.

Preserve existing diffs. Do not stash, reset, clean or commit unfinished work merely to obtain a clean checkout. Construction commits must pass the [delivery gate](supervision.md#before-delivery).

Before cleanup or a branch change, inspect added and ignored paths and protect existing work and private references. Delete only verified task-owned scratch paths under the user's shell and cleanup rules.
