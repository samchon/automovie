---
name: production-campaign
description: Coordinates writers and reviewers launched as CLI processes across productions.
---

# Production campaign

The repository coordinator launches and monitors production workers, relays reviews and compares productions.

| Read | For |
| --- | --- |
| [Launching workers](launching-workers.md) | Preparing a production, launching writers and reviewers, write scope |
| [Run records](run-records.md) | Writing the run record, resuming a run, handing off |
| [Observing runs](observing-runs.md) | The observer subagent's brief: its ticks and the revival of a stopped run |
| [Connecting review](connecting-review.md) | Fixing a submission, launching a reviewer, relaying verdicts |
| [Git ownership](git-ownership.md) | Staging and committing beside other workers |
| [Comparing productions](comparing-productions.md) | Declaring and reporting a comparison |

## Owners

The production's [sustained runs guide](../../../packages/template/scaffold/instructions/.agents/skills/production/sustained-runs.md) owns run records, dispatch, writer scopes and resumption. Specialist skills own creation and acceptance. Use issue campaigns for engineering audits and publication.

This repository uses an observer subagent and CLI worker processes. The scaffold leaves scheduling and dispatch to the production and user authority.

## Authority

A campaign authorizes workers within its requested productions and scope. Observation authorizes resuming existing runs. State the scope and baseline.

## Missing capabilities and viewers

Route missing capabilities to their [owner](../project/SKILL.md#packages). Implement and validate under [development](../development/SKILL.md), then reconnect the consumer.

Update installed productions under scaffold prompting's [verification](../scaffold-prompting/verification.md#distribution).

Restore a broken viewer first. Verify the failing consumer path and report observed and unperformed checks.
