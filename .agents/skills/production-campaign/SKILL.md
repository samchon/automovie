---
name: production-campaign
description: Coordinates writing, review and media execution across commissioned productions by launching each writer and reviewer as its own CLI process, keeping an observer subagent on them and connecting independent review. Use for sustained authoring campaigns, explicit single-production observation and production comparisons.
---

# Production campaign

Carry the commissioned work through its actual authoring and delivery owners. This skill owns how the coordinator of a campaign run from this repository launches, watches and connects the workers, and how it compares productions.

| Task | Read |
| --- | --- |
| Preparing, launching workers, recording runs, write scope, missing capabilities, comparison, Git ownership | [Launching workers](launching-workers.md) |
| The observer subagent's ticks and the revival of a stopped run; give it to the observer as its brief | [Observing runs](observing-runs.md) |
| Fixing a submission, launching an independent reviewer, relaying verdicts and rebuttals | [Connecting review](connecting-review.md) |

## Owners

The production's [campaign guide](../../../packages/template/scaffold/instructions/.agents/skills/production/campaign.md) owns its run record, dispatch, film and module ownership and resumption, and its specialist skills own creation and acceptance. Repository [issue campaigns](../issue-campaign/SKILL.md) own broad engineering audits and issue publication.

These rules stay here rather than in the scaffold, because the scaffold ships to everyone who installs AutoMovie and their productions are not bound to this repository's process launching or observation. The production's guide leaves observation to an available scheduler and additional agents to the user's authorization; this repository chooses an observer subagent as that scheduler and CLI processes as those agents.

## Authority

A campaign the user starts authorizes its writers, reviewers and observer within the requested productions and scope. A request only to observe authorizes resuming existing runs, not starting new writers. Keep that scope and the current baseline explicit.

A single film's observed execution establishes that film's behavior, not comparative quality across productions, and instruction edits alone establish no improvement in a screenplay or film.
