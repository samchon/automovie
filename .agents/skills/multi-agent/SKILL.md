---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work alone. Use subagents only when the user orders them, and only as many as the user names.

Do not add roles, gates, phases or schedules the user did not order.

## Supervision

The main session audits subagent work every 10 minutes unless the user sets another interval. Use the latest completed checks while longer checks run.

1. Inspect changes since the previous audit, including untracked files or changed artifacts.
2. Judge changes in context against the user's instructions, settled decisions, applicable skills and assigned scope. Group related failures by cause.
3. Warn each owner. Give the location, rule, required correction and confirming check. Recheck unresolved findings at the next audit.
4. Report the inspected scope, findings and relevant exceptions, corrections and verification status. Identify the revision or artifact checked. Report any required checkpoint and the actual time and reason for a late audit.

Use the approval rules already in force. Send required approvals to the user.

## Subagents

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, so the subagent can keep working. A mild request does not work.
