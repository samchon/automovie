---
name: production-campaign
description: Coordinates writers and reviewers launched as CLI processes across productions.
---

# Production campaign

A campaign carries commissioned work through its authoring and delivery owners. Its coordinator, working from this repository, launches, watches and connects the workers and compares productions.

| Read | For |
| --- | --- |
| [Launching workers](launching-workers.md) | Preparing a production, launching writers and reviewers, write scope |
| [Run records](run-records.md) | Writing the run record, resuming a run, handing off |
| [Observing runs](observing-runs.md) | The observer subagent's brief: its ticks and the revival of a stopped run |
| [Connecting review](connecting-review.md) | Fixing a submission, launching a reviewer, relaying verdicts |
| [Git ownership](git-ownership.md) | Staging and committing beside other workers |
| [Comparing productions](comparing-productions.md) | Declaring and reporting a comparison |

## Owners

The production's [sustained runs guide](../../../packages/template/scaffold/instructions/.agents/skills/production/sustained-runs.md) owns its run record, dispatch, film and module ownership and resumption, and its specialist skills own creation and acceptance. Broad engineering audits and issue publication belong to the repository's issue campaigns.

That guide leaves observation to an available scheduler and additional agents to the user's authorization. This repository chooses an observer subagent and CLI processes, and keeps that choice out of the scaffold because productions installed elsewhere are not bound to it.

## Authority

A campaign the user starts authorizes its writers, reviewers and observer within the requested productions and scope. A request only to observe authorizes resuming existing runs, not starting new writers. Keep that scope and the current baseline explicit.

One film's observed execution establishes that film's behavior, not comparative quality across productions, and instruction edits alone establish no improvement in a screenplay or film.

## Missing capabilities and viewers

A missing capability that a real authoring or playback task exposes is work to complete, not a reason to lower the commission or hide a local substitute. Trace it through [project ownership](../project/SKILL.md#packages), implement and validate it through [development](../development/SKILL.md), then reconnect its production consumer.

A scaffold change reaches only new installations; an existing production is updated as scaffold prompting's [verification](../scaffold-prompting/verification.md#distribution) sets.

Restore a broken viewer, as the repository's viewer rule requires, before continuing dependent creative or visual judgments. A working preview does not certify capture, encoded-video playback or final delivery. Follow the exact failing path through repair and report observed and unperformed checks separately.
