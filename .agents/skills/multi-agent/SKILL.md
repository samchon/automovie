---
name: multi-agent
description: Governs subagent delegation and audits.
---

# Multi-agent

## Default

Work alone unless the user requests subagents. Use the authorized count and workflow. Refer approvals to the user.

## Supervision

Audit every 10 minutes unless the user sets another interval.

1. Inspect the work.
   - Read changes and new files.
   - Check instructions, decisions, skills and scope.
   - Read the latest completed checks.
2. Address findings.
   - Group failures by cause.
   - Warn owners and order fixes.
   - Give the location, rule and confirming check.
   - Recheck open findings at the next audit.
3. Report the audit.
   - Name the revision or artifact.
   - List findings, exceptions and fixes.
   - Give check status and any checkpoint.
   - Give the actual time and reason for delays.

## Continuing

A Claude Code subagent may stop mid-task with a message like this:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Claude Code subagents can compact the context on their own.

The main session must resume the same subagent with a firm order to continue the task and never stop for context. A mild request to resume does not hold.
