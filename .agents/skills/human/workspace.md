# Workspace

## References

- Call the references f1, f2, m1 and m2, or the reference source, in every file, issue, commit and pull request.
- The reference data is private: read it, and keep it out of commits, copies and deletions.
- Acquire further references without asking, with tooling kept in tracked paths under development's [Scripts And Shared Checkouts](../development/SKILL.md#scripts-and-shared-checkouts).

## Ignored Paths

`test/.shots`, `test/src/executable`, `.shots`, `.references` and `packages/human/.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. New Human captures belong in `packages/human/.shots`.

Work only in the local checkout, never in another clone or worktree, so every worker and the supervisor see one tree. Give every file write and output redirect an absolute path, because a relative one resolves against the process's own directory and lands a stray file elsewhere in the tree. Commit work in progress instead of stashing it, because one worker's pop applies another's changes. Use `git clean` without `-x` and `--all`, and compare a branch's added paths with the disk before switching to it.
