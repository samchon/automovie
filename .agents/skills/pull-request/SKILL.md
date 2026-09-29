---
name: pull-request
description: Defines automovie branch, commit, pull-request, check, and merge workflows. Use when shipping a topic-unit PR under the standing instruction, when the user asks to open, update, or merge a pull request, or when a standing autonomous mandate authorizes end-to-end delivery; never merge on unprompted initiative.
---

# Pull Request Submission

Work proceeds in topic-unit PRs, one coherent topic per PR, never committed to `master` directly. An ordinary topic PR opens after its required local verification. An authorized campaign's implementation-free claim PR follows the campaign override below.

Permission to open is not permission to merge. Merge only when the user explicitly asks, or under a standing autonomous mandate: an autonomous campaign (the conquest loop) or an explicit instruction to carry the work through merge. The mandate is the request for every step it names, push and merge included, and every check, verification and Self-Review gate still applies to each step.

## Branch From The Target

Branch from the PR target (`master` unless stated otherwise) and name the branch for the change: `feat/<scope>`, `fix/<scope>`, `test/<scope>`, `docs/<scope>`, `ci/<scope>`.

Use the current checkout and one topic branch for ordinary pull requests, issue campaigns and Self-Review. Create no other clone or worktree. When unrelated or protected work blocks a safe branch switch, preserve it and report the blocker instead of stashing, reverting or mixing it.

## Commit Logical Units

Make one commit per coherent unit, not one mega-commit for a large diff. Use the `<type>(<scope>): <subject>` message style and end the message with the `Co-Authored-By` trailer. Stage explicit paths when the working tree is mixed, and never include unrelated user changes silently. Inspect Markdown-only and agent-instruction diffs directly and run `git diff --check`. Formatting runs once before merge, as described below, and not for intermediate commits, draft heads or correction pushes.

## Write The Pull Request

Write the PR body at open: intent, scope, deferred items, test plan. It is the PR's historical intent statement, so do not rewrite it on every follow-up push. Use a file-backed body for multiline Markdown through `gh`.

Record later CI fixes, newly found issues and Self-Review results as formal GitHub pull-request reviews with the `COMMENT` event, so the thread keeps its chronology. Use an inline comment for an observation tied to a changed line and the review body for commit-wide or round-wide results. Never `APPROVE` or `REQUEST_CHANGES` on your own pull request.

The title describes the merged outcome in `<type>(<scope>)` style, not the work process.

## Campaign Override

Before a campaign implementation push or pull request, complete the [campaign development procedure](../issue-campaign/development.md). Its commit-message, check-cadence, CI-repair and cleanup rules override the ordinary flow here.

## Read Checks For The Applicable Head

After every push, watch `gh pr checks <PR>` until each check settles. On failure, fetch the job log, diagnose the real cause, fix it in place and push a new commit. Both `build` and `test` must pass, and a green unrelated job does not accept a failed required surface. The workflows own their commands; the [development skill](../development/SKILL.md#coverage-is-100-on-what-you-write) owns the unit-test obligation. The `build` and `test` workflows run for pull requests and for pushes to `master`.

A campaign implementation cycle reads CI once per settled head under its own development procedure. Its intermediate commits are not gates, and its merge still requires the settled head's green required checks.

## Merge On Explicit Request Or Standing Autonomous Mandate

Finish implementation and CI repair first. For a pull request that changes configured source, run the formatter once on the final candidate: `pnpm run format` when the checkout holds only this pull request's changes, and otherwise format only the pull request's paths, because the root command writes across the repository. Commit any formatting diff to the same pull request and wait for required checks on that head. A Markdown-only pull request needs no source-formatting pass.

When every required check passes on the formatted final head, squash-merge (the repository keeps linear history) and delete the branch. After GitHub records the merge, observe the `master` push `build` and `test` checks on the exact merge commit. A green pull-request head does not substitute for the post-merge event, and a red `master` run reopens delivery work immediately.

If CI is red because code, tests, build, formatting or generated artifacts failed, fix the pull request and wait for green. If CI cannot start or finish for external infrastructure reasons outside the topic's code (billing, service outage, missing runner capacity, permissions), report the exact blocker, document the local verification in the pull request, and merge only after the user explicitly repeats the merge instruction. Never force-merge against branch protection; if GitHub refuses the merge, report the blocker.
