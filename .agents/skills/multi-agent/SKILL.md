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

When an active Claude Code worker stops for context, direct it explicitly to continue in the same session. Claude Code compacts earlier turns as needed.

If the session cannot resume, use its latest verified files, checks and decisions to brief an authorized replacement. Record the interruption and keep any unverified result open.
