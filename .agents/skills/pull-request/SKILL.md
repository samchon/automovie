---
name: pull-request
description: Opens, updates and merges automovie pull requests when authorized.
---

# Pull request

Use this workflow when the user or a delivery mandate authorizes the action. A request to open a pull request includes committing and pushing its changes. Leave version bumps, tags and releases to the maintainer.

## Opening a pull request

Create a `<type>/<scope>` branch from `master` in the current checkout. Stage only paths you own. Commit as `<type>(<scope>): <imperative lowercase subject>`, push the branch and open the pull request against `master`.

### Body

In the opening body, explain the intent, scope, deferred work, local verification and skipped checks. For pull requests, issues and comments, save the text as UTF-8, pass the file with `--body-file` and read back the published text.

## Updating a pull request

Record later fixes and each [self-review](../review/SKILL.md) round in a `COMMENT` review. Attach findings to the relevant lines.

Review the diff for simple documentation and skill edits and leave CI unattended. For other changes, let the current head's checks finish before pushing a correction.

## Merging

Squash-merge when the user requests it or a delivery mandate authorizes it. When CI monitoring applies, verify that the required checks passed on the exact head. Issue campaigns also require a completed [overall self-review](../review/SKILL.md#overall-self-review) on that head. Honor branch protection and report any block.

After a user-requested merge, run `git checkout master` and then `git pull`.
