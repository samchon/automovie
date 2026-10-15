---
name: pull-request
description: Branches, commits, pushes, opens, updates, and merges automovie pull requests. Use only when the user asks for one of those actions or a mandate names delivery.
---

# Pull Request

Pushing, opening, and merging each need the user's request or a mandate that names them.

- Branch `<type>/<scope>` from `master` in the current checkout. Never commit to `master`, and stage only your own paths.
- When the target branch gains commits this branch also carries, such as a pull request split off from it, merge the target in at once instead of letting the copies diverge.
- Commit as `<type>(<scope>): <imperative lowercase subject>`.
- Write the body once: intent, scope, deferred items, local verification, and skipped checks. Record later fixes and [Self-Review](../review/SKILL.md) rounds as `COMMENT` reviews, with line findings inline, never as ordinary comments, `APPROVE`, or `REQUEST_CHANGES`.
- Push a correction only after every check of the current head has settled, because a push cancels the running checks.
- Squash-merge once required checks are green on the exact head, plus a clean [Overall Self-Review](../review/SKILL.md#overall-self-review) on it for an [issue campaign](../issue-campaign/SKILL.md). Under a delivery mandate, merge without asking. Report a branch-protection block instead of bypassing it.
- Never bump versions, tag, or publish; releases belong to the maintainer.
