# Workspace

## References

- Call the references f1, f2, m1 and m2, or the reference source, in every file, issue, commit and pull request.
- Their typed parameters are `packages/playground/src/human-parameters/<alias>.ts`, measured by the documented definitions.
- Acquire further references without asking, by the local reference-experiments tooling under `test/src/executable/`.

## Ignored Paths

`test/.shots`, `test/src/executable`, `.shots` and `packages/human/.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. New Human viewer evidence belongs in `packages/human/.shots`; preserve historical captures under `packages/playground/.shots`. Use `git clean` and `git stash` without `-x` and `--all`, and compare a branch's added paths with the disk before switching to it.
