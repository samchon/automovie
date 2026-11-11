# Workspace

## References

- Call the references f1, f2, m1 and m2, or the reference source, in every file, issue, commit and pull request.
- Acquire further references without asking, with tooling kept in tracked paths under development's [Scripts And Shared Checkouts](../development/SKILL.md#scripts-and-shared-checkouts).

## Ignored Paths

`test/.shots`, `test/src/executable`, `.shots`, `.references` and `packages/human/.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. New Human viewer evidence belongs in `packages/human/.shots`. Use `git clean` and `git stash` without `-x` and `--all`, and compare a branch's added paths with the disk before switching to it.
