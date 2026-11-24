---
name: multi-agent
description: Sets how the director follows the user's orders on subagents and keeps them working.
---

# Multi-agent

## Assignments

The [director](../production/director.md#assignments) assigns a writer, an Evidence answerer and an independent reviewer. When the user orders other roles, another number or no subagents, follow the user's order.

Start a new subagent only where its role needs independence, as the reviewer and the Evidence answerer do.

## Continuing

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, and the project's records hold the work, so the subagent can keep working. A mild request does not work.
