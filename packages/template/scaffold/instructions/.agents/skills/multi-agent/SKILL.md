---
name: multi-agent
description: Sets how the director uses and supervises its subagents.
---

# Multi-agent

## Default

Use the subagents the [director](../production/director.md#assignments) assigns: a writer, an Evidence answerer and an independent reviewer. When the user orders other roles, another number or no subagents, follow the user's order.

Do not add roles, gates, phases or schedules the user did not order.

## Supervision

The director audits the subagents' finished work every 10 minutes, or at the interval the user sets. It checks for violations of:

- the user's orders;
- the user's decisions;
- the skills' rules.

On a violation, it shows the subagent the problem and orders a fix. It adds no approval step. Approvals the rules require go to the user.

## Subagents

Start a new subagent only where its role needs independence, as the reviewer and the Evidence answerer do.

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, and the project's records hold the work, so the subagent can keep working. A mild request does not work.
