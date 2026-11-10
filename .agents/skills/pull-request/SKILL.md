---
name: pull-request
description: Branches, commits, pushes, opens, updates, and merges automovie pull requests. Use only when the user asks for one of those actions or a mandate names delivery.
---

# Pull Request

Pushing, opening, and merging each need the user's request or a mandate that names them. Never bump versions, tag, or publish; releases belong to the maintainer.

## Branch And Commit

- Branch `<type>/<scope>` from `master` in the current checkout.
- Never commit to `master` or use another clone or worktree.
- Stage only your own paths.
- Commit as `<type>(<scope>): <imperative lowercase subject>`.

## Body

Write the body once: intent, scope, deferred items, local verification, and skipped checks.

Record later fixes and [Self-Review](../review/SKILL.md) rounds as `COMMENT` reviews, with line findings inline, never as ordinary comments, `APPROVE`, or `REQUEST_CHANGES`.

Write an issue, pull request or comment body to a UTF-8 file and pass it with `--body-file` from a shell that keeps its bytes, then read the published body back. Windows PowerShell 5.1 reads UTF-8 without a BOM as ANSI and turns every non-ASCII character into `?`.

## Push And Merge

Push a correction only after every check of the current head has settled, because a push cancels the running checks.

Squash-merge once required checks are green on the exact head. An [issue campaign](../issue-campaign/SKILL.md) also needs a clean [Overall Self-Review](../review/SKILL.md#overall-self-review) on that head.

Under a delivery mandate, merge without asking. Report a branch-protection block instead of bypassing it.
