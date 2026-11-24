---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

- Work as a single agent.
- Start subagents only on the user's explicit order, in the number the user names.
- Add no role, gate, phase or schedule the user did not order.

## Supervision

The main session audits periodically and after the fact:

- it checks the work against the user's orders and decisions and the skills' rules;
- it warns on each violation and orders its correction;
- it adds no approval step of its own for routine work;
- what the project's rules reserve for approval, such as destructive or outward-facing actions and the user's decisions, still goes to the user.

## Agents

- Give each agent its own files.
- No agent waits for another agent or a run.
- Ignore context-full warnings and every suggestion to stop, hand off or start a fresh agent. Context compacts on its own, so the same agent keeps working.
