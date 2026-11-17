# Workspace

## References

- Call the references f1, f2, m1 and m2, or the reference source, in every file, issue, commit and pull request.
- The reference data is private: read it, and keep it out of commits, copies and deletions.
- Acquire further references without asking, with tooling kept in tracked paths under development's [Scripts and shared checkouts](../development/SKILL.md#scripts-and-shared-checkouts).

## Ignored paths

`test/.shots`, `test/src/executable`, `.shots`, `.references` and `packages/human/.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. New Human captures belong in `packages/human/.shots`.

Work only in the local checkout, never in another clone or worktree, so every worker and the supervisor see one tree. Give every file write and output redirect an absolute path, because a relative one resolves against the process's own directory and lands a stray file elsewhere in the tree.

Preserve existing diffs. Do not stash, reset, clean or commit unfinished work merely to obtain a clean checkout. Construction commits must pass the [delivery gate](supervision.md#before-delivery).

Before cleanup or a branch change, inspect added and ignored paths and protect existing work and private references. Delete only verified task-owned scratch paths under the user's shell and cleanup rules.
