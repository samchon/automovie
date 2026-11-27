---
name: issue-campaign
description: Runs discovery rounds and lands their issues in one pull request per cycle.
---

# Issue campaign

Audit the target branch to a clean discovery round. When authorized, resolve the accepted issues in one pull request per cycle.

Stay within the phases the user authorized; an audit-only request publishes and pushes nothing. Discover and fix only within the campaign's named topic, and say so at once if the work must reach beyond it.

Finish when the latest baseline has no findings, all accepted issues are closed and the campaign's branches, pull requests and temporary assets are cleared.

## Discovery

Discovery runs in this order:

1. Run a complete round over the declared scope under the [review rules](../review/SKILL.md#review-rules).
2. Check owner, history and duplicates. Accept, merge, split or reject each.
3. Repeat full rounds on one baseline until one finds nothing meaningful.

A round includes real workflows, related issues and pull requests, and the [contracts](../contracts/SKILL.md) even where tests pass. The last round freezes the accepted set, and a target-branch change restarts discovery.

## Issues

With publication authority, write each accepted issue so a fresh agent can start from it alone:

- the problem;
- its reproduction and root cause;
- affected behavior and cases;
- required behavior;
- acceptance cases with commands;
- dependencies.

Publish bodies as the pull-request [body](../pull-request/SKILL.md#body) rules set.

## Pull request

### 1. Draft pull request

Branch from the baseline, push an empty commit (`git commit --allow-empty`), and open one draft pull request listing every cycle issue, with no closing keywords.

### 2. Implementation

Implement every issue in dependency order with its tests. Drop an issue only as a duplicate, invalid, out of scope or externally blocked, and say so on the issue.

### 3. Closing lines

End each resolving commit with `Close #n: <title>` per issue. Remove the line when reverting so squash cannot close the issue.

### 4. Individual self-review

After each pushed commit, run [individual self-review](../review/SKILL.md#individual-self-review) and record it as a `COMMENT` review, as the pull-request body rules set.

### 5. Overall self-review

On the integrated head, run [overall self-review](../review/SKILL.md#overall-self-review) while CI runs. Fix every failed check, pre-existing ones included, and repeat on the new head.

### 6. Merge

[Format](../development/validation.md#formatting), then [merge](../pull-request/SKILL.md#merging) with authority once one head is green and review-clean. First read `git log origin/master..HEAD` to confirm each closed issue keeps its fix, and reopen any that does not.

### 7. Next cycle

After merge, `git pull --ff-only` on `master`, delete the topic branch, remove only the temporary paths the campaign created, and start the next cycle.

## Handoff

Keep unfinished work and its checks in their current state when the user ends a campaign.

1. Stop every worker, keeping only changes that build, and commit them.
2. Publish one handoff issue containing the context a fresh session needs.
3. Comment on each open issue with progress and the handoff.
   - Close only issues whose acceptance criteria are met.
4. State met and unmet criteria in the PR body. Merge as the user directs.

The handoff issue holds:

- the user's standing rules;
- where the code, tools and tests are;
- the baseline results;
- each open item, in order.

For each open item, include the verified cause, measurements that ruled out other causes, relevant code and next action. Include the findings the successor needs to proceed without local scratch files.
