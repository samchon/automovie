---
name: multi-agent
description: Keeps a Claude Code subagent working when it stops for context.
---

# Multi-agent

## Continuing

A Claude Code subagent may stop and say:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Order it firmly to continue. Claude Code summarizes old turns when the context fills, and the project's records hold the work, so the subagent can keep working. A mild request does not work.
