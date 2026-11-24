---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work as a single agent. Start subagents only on the user's explicit order and in the number the user names.

Add no role, gate, phase or schedule the user did not order.

## Supervision

The main session audits the subagents' work every 10 minutes, after the fact, for violations of:

- the user's orders;
- the user's decisions;
- the skills' rules.

It warns on each violation and orders its correction.

It adds no approval step of its own for routine work. Approvals the project's rules reserve, such as destructive or outward-facing actions and the user's decisions, still go to the user.

## Subagents

Give each subagent its own files.

No subagent waits for another subagent or a run.

A Claude Code subagent stops mid-task with a message like this:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Claude Code compacts the context on its own. The main session tells that subagent to continue its task and resumes the same subagent.
