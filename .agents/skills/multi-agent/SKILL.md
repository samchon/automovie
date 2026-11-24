---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work as a single agent. Start subagents only on the user's explicit order and in the number the user names, and add no role, gate, phase or schedule the user did not order.

## Supervision

The main session audits the subagents' work periodically and after the fact, for violations of:

- the user's orders;
- the user's decisions;
- the skills' rules.

It warns on each violation and orders its correction. It adds no approval step of its own for routine work. What the project's rules reserve for approval, such as destructive or outward-facing actions and the user's decisions, still goes to the user.

## Agents

Give each agent its own files. No agent waits for another agent or a run.

Ignore context-full warnings and every suggestion to stop, hand off or start a fresh agent. Context compacts on its own, so the same agent keeps working.
