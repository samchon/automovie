# Workspace

## References

- Call the references f1, f2, m1 and m2, or the reference source. The user does not want the generator behind them named in any file, issue, commit or pull request.
- Their typed parameters are `packages/playground/src/human-parameters/<alias>.ts`, measured by the documented definitions.
- Acquire further references without asking, by the local reference-experiments tooling under `test/src/executable/`.

## Ignored Paths

`test/.shots`, `test/src/executable` and `.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning. Run no `git clean -x` or `git stash --all`, and compare a branch's added paths with the disk before switching to it.

## Shared Checkout

When several agents work in one checkout, give each its own scratch directory and viewer port, allow no recursive delete outside its own directory, and commit with `git add` then `git commit --only <paths>`. A shared index lets one commit sweep another agent's files, and a recursive delete can wipe every agent's scratch.
