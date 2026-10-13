---
name: pull-request
description: Branches, commits, pushes, opens, updates, and merges automovie pull requests. Use when shipping a topic or when asked to push, open, update, or merge; merge only on request or under a mandate that names delivery.
---

# Pull Request

Merging needs the user's request or a mandate that names carrying the work through merge.

- Branch `<type>/<scope>` from `master` in the current checkout, never another clone or worktree. Stage only your own paths, with `git add` and `git commit --only` in one command when another writer shares the index.
- Commit as `<type>(<scope>): <imperative lowercase subject>`.
- Write the body once: intent, scope, deferred items, local verification, and skipped checks. Record later fixes and Self-Review rounds as `COMMENT` reviews, with line findings inline, never as ordinary comments, `APPROVE`, or `REQUEST_CHANGES`.
- Push a correction only after every check of the current head has settled, because a push cancels the running checks.
- Merge once `build` and `test` are green on the exact head, plus a clean Overall Self-Review on it for a campaign: run `pnpm run format`, commit everything it changes, push, and squash-merge without waiting for checks on that commit. Report a branch-protection or infrastructure block instead of bypassing it.
- After merge, a red `master` run on the merge commit reopens the work.
- Never bump versions, tag, or publish.
