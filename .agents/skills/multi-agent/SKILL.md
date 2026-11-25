---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work alone. Use subagents only when the user orders them, and only as many as the user names.

Do not add roles, gates, phases or schedules the user did not order.

## Supervision

The main session audits the subagents' work every 10 minutes unless the user sets another interval. Keep the cadence while checks run and use their latest completed results.

1. Compare the work with the last inspected state. Read the diff and new files, or compare the changed artifacts when work is outside version control. Include changes to shared contracts and tests.
2. Judge what changed against the user's instructions, settled decisions, applicable skills and the agent's assigned scope. Read the context for each search hit before judging it. Cite the location and rule for each violation. Record any exception that changes the verdict.
3. Read the latest completed checks and identify the revision or artifact they tested. Group related failures by cause and record checks still running or unavailable.
4. Warn the owning agent about each violation and order the correction. Give the evidence, the requirement and the check that will confirm the fix. Follow up in the next audit until completed evidence confirms the correction.
5. Report what was inspected, what was found, who was told to act and which fixes are verified or pending. Record the checkpoint result when the task calls for one. If an audit runs late, report when it ran and why.

The audit adds no approval step. Send approvals required by the applicable rules to the user.

## Subagents

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, so the subagent can keep working. A mild request does not work.
