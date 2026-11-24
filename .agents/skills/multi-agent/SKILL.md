---
name: multi-agent
description: Sets when automovie runs subagents and how the main session supervises them.
---

# Multi-agent

## Default

Work alone. Use subagents only when the user orders them, as many as the user names.

Add no role, gate, phase or schedule the user did not order.

## Supervision

Every 10 minutes, the main session audits the subagents' finished work for violations of:

- the user's orders;
- the user's decisions;
- the skills' rules.

It warns and orders a fix for each violation, and adds no approval step of its own. Approvals the rules reserve still go to the user.

## Subagents

A Claude Code subagent stops with a message like this:

> My context is nearly full. I'll stop here; a fresh agent can pick this up from my notes.

Its context compacts on its own. Resume the same subagent with a firm order to continue; a mild request does not hold.
