---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work as a single agent. Start subagents only when the user asks for them in their own words, and start as many as the user names. A plan, a constraint or a long task is not such an order.

Ask the user before adding an agent, a role, a phase, a gate or a schedule the user did not order.

## Supervision

The main session supervises by a periodic audit and nothing more. It approves no work in advance: agents decide by the references and rules, land, and report. The audit checks what landed and orders corrections.

Each audit, at a fixed interval and kept short, covers:

- the last completed type-check cycle, with each error sent to its owner first;
- the new commits, with every added rule naming its reference and no cache, ladder, tuned constant or weakened test;
- the tree, for two agents editing one file;
- the batch queue, with one batch at a time on the machine;
- the target count, from local runs on the working tree rather than from commits;
- CI, from the explicit pass and fail marks in the full job logs.

Answer the user's questions before continuing, and relay results as they are.

## Agents

Keep the number of agents to what the user named. Stop an agent when its task ends; a withdrawn agent is switched off, not given a new role.

Give each agent a disjoint write set and a brief that stands alone: the shell rule, the rules file, the references to read and the deadline. Agents share one checkout without worktrees and agree file handovers with the file's owner directly.

An agent lands finished work in the tree at once, type-clean and by cause. Never hold finished work behind another agent's landing. Never roll back another agent's work; only the user sets work aside.

No agent waits on a run. Specs run together in one command, and each agent stops only its own processes. Resume the same agent rather than replacing it unless the user orders a new one.

## Deadlines

Implementing a decided, researched design takes minutes. Give short deadlines and challenge longer estimates instead of relaying them; only test results extend a deadline.
