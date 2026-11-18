---
name: pull-request
description: Branches, commits, pushes, opens, updates and merges pull requests.
---

# Pull request

Pushing, opening and merging each need the user's request or a mandate that names them. Never bump versions, tag or publish; releases belong to the maintainer.

## Branch and commit

- Branch `<type>/<scope>` from `master` in the current checkout.
- Never commit to `master` or use another clone or worktree.
- Stage only your own paths, as a [shared checkout](../development/SKILL.md#several-agents-in-one-checkout) requires.
- Commit as `<type>(<scope>): <imperative lowercase subject>`.

## Body

Write the body once: intent, scope, deferred items, local verification and skipped checks.

Record later fixes and each [self-review](../review/SKILL.md) pass or round as a `COMMENT` review, with line findings inline, never as ordinary comments, `APPROVE` or `REQUEST_CHANGES`.

Write issue, pull request and comment bodies to UTF-8 files. Submit them with `--body-file` and read back the published text. Avoid PowerShell 5.1's default ANSI decoding of UTF-8 without a BOM.

## Push and merge

Skip CI monitoring for documentation and skill edits that leave product behavior unchanged. For other changes, wait for checks on the current head before pushing a correction.

Before an authorized squash merge, verify required checks on the exact head for changes that require CI monitoring. An issue campaign also needs a completed [overall self-review](../review/SKILL.md#overall-self-review) on that head.

Under a delivery mandate, merge without asking. Report a branch-protection block instead of bypassing it.

After a user-requested merge, run `git checkout master` and then `git pull`.
