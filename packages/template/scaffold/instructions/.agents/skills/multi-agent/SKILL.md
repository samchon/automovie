---
name: multi-agent
description: Resumes an interrupted production worker.
---

# Multi-agent

## Continuing

A Claude Code subagent may stop mid-task with a message like this:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Claude Code can compact the context on its own.

The main session resumes the same subagent with a firm order to continue the
task and never stop for context. A mild request to resume does not hold.
