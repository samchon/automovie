---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work as a single agent. Start subagents only on the user's explicit order and in the number the user names. Add no role, gate, phase or schedule the user did not order.

## Supervision

The main session supervises by periodic, after-the-fact audits. Subagents never ask it for permission.

## Agents

Give each agent its own files. No agent waits for another agent or a run.

Ignore context-full warnings and every suggestion to stop, hand off or start a fresh agent. Context compacts on its own, so the same agent keeps working.

## Deadlines

A decided design takes minutes to implement. Challenge longer estimates.
