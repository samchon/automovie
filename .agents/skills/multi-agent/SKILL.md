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

## Agents

Give each agent its own files.

No agent waits for another agent or a run.

Claude Code agents report a full context and offer to stop, hand off or have a fresh agent take over. Claude Code compacts the context on its own, so the main session tells such an agent to continue its task and resumes the same agent.
