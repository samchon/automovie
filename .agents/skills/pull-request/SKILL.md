---
name: pull-request
description: Branches, commits, pushes, opens, updates, and merges automovie pull requests. Use only when the user asks for one of those actions or a mandate names delivery.
---

# Pull request

Pushing, opening and merging each need the user's request or a mandate that names them. Never bump versions, tag or publish; releases belong to the maintainer.

## Branch and commit

Each pull request follows these rules for its branch and commits:

- Branch `<type>/<scope>` from `master` in the current checkout.
- Never commit to `master` or use another clone or worktree.
- Stage only your own paths, as a [shared checkout](../development/SKILL.md#several-agents-in-one-checkout) requires.
- Commit as `<type>(<scope>): <imperative lowercase subject>`.

## Body

Write the body once: intent, scope, deferred items, local verification and skipped checks.

Record later fixes and each [self-review](../review/SKILL.md) pass or round as a `COMMENT` review, with line findings inline, never as ordinary comments, `APPROVE` or `REQUEST_CHANGES`.

Write an issue, pull request or comment body to a UTF-8 file, pass it with `--body-file` from a shell that keeps its bytes, then read the published body back. Windows PowerShell 5.1 reads UTF-8 without a BOM as ANSI and turns every non-ASCII character into `?`.

## Push and merge

Push a correction only after every check of the current head has settled, because a push cancels the running checks.

Squash-merge once required checks are green on the exact head. An issue campaign also needs a completed [overall self-review](../review/SKILL.md#overall-self-review) on that head.

Under a delivery mandate, merge without asking. Report a branch-protection block instead of bypassing it.
