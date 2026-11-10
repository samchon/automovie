---
name: production-campaign
description: Coordinates writing, review and media execution across commissioned productions by launching each writer and reviewer as its own CLI process, keeping an observer subagent on them and connecting independent review. Use for sustained authoring campaigns, explicit single-production observation and production comparisons.
---

# Production campaign

A campaign carries commissioned work through its actual authoring and delivery owners. Its coordinator, working from this repository, launches, watches and connects the workers and compares productions.

| Task | Read |
| --- | --- |
| Preparing a production, launching writers and reviewers, their write scope | [Launching workers](launching-workers.md) |
| Writing the run record, resuming a run, handing off | [Run records](run-records.md) |
| The observer subagent's ticks and the revival of a stopped run | [Observing runs](observing-runs.md) |
| Fixing a submission, launching an independent reviewer, relaying verdicts and rebuttals | [Connecting review](connecting-review.md) |
| Staging and committing beside other workers | [Git ownership](git-ownership.md) |
| Comparing productions | [Comparing productions](comparing-productions.md) |

Give [Observing runs](observing-runs.md) to the observer as its brief.

## Owners

The production's [campaign guide](../../../packages/template/scaffold/instructions/.agents/skills/production/campaign.md) owns its run record, dispatch, film and module ownership and resumption, and its specialist skills own creation and acceptance. Repository [issue campaigns](../issue-campaign/SKILL.md) own broad engineering audits and issue publication.

These rules stay here rather than in the scaffold, because the scaffold ships to everyone who installs AutoMovie and their productions are not bound to this repository's process launching or observation. The production's guide leaves observation to an available scheduler and additional agents to the user's authorization; this repository chooses an observer subagent as that scheduler and CLI processes as those agents.

## Authority

A campaign the user starts authorizes its writers, reviewers and observer within the requested productions and scope. A request only to observe authorizes resuming existing runs, not starting new writers. Keep that scope and the current baseline explicit.

A single film's observed execution establishes that film's behavior, not comparative quality across productions, and instruction edits alone establish no improvement in a screenplay or film.

## Missing capabilities and viewers

A missing capability that a real authoring or playback task exposes is work to complete, not a reason to lower the commission or hide a local substitute. Trace it through [project ownership](../project/SKILL.md#packages), implement and validate it through [development](../development/SKILL.md), then reconnect its actual production consumer.

Use [scaffold](../scaffold/SKILL.md) for explicit instruction sync; source, configuration and contract migrations remain deliberate project changes.

Apply the production's viewer recovery priority before continuing dependent creative or visual judgments. A working preview does not certify capture, encoded-video playback or final delivery. Follow the exact failing path through repair and report observed and unperformed checks separately.
