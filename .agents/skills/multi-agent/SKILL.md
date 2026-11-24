---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work alone. Use subagents only when the user orders them, and only as many as the user names.

Do not add roles, gates, phases or schedules the user did not order.

## Supervision

The main session audits the subagents' work for violations of:

- the user's instructions;
- the decisions settled for the work;
- the skills' rules.

It audits every 10 minutes unless the user sets another interval.

On a violation, it warns the subagent and orders a fix.

It adds no approval step of its own. Approvals the rules require go to the user.

## Subagents

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, so the subagent can keep working. A mild request does not work.
