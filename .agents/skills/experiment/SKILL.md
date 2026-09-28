---
name: experiment
description: Defines how automovie supervises an ad-hoc experiment or benchmark - creating a disposable source-linked sandbox under experimental/, launching and steering a live Claude Code or Codex session that authors inside it against working-tree code, keeping it alive, relaying the user's directives, recording the run, and deciding what an observation is worth. It is a minimal supervision overview and prescribes nothing about how the production is authored, reviewed, staged, or judged; the generated project's shipped scaffold skills own all of that. Use when the user asks to try something out, drive a generated project by hand, run a benchmark against an authoring agent, or see how a change behaves through a real agent; do not use for a render inspection of something already running (viewer-verification) or a repository-wide audit (issue-campaign).
---

# Experiment

An experiment answers one question by running the real thing. Create a disposable sandbox, start a live agent in it, supervise the run, read what happens, and throw the sandbox away. An experiment produces an observation, not a score.

## Supervision Only

This skill supervises. It never tells the authoring agent how to author, review, stage, or judge its production. The generated project's shipped skills own all of that: its `AGENTS.md`, contracts, and the `contract`, `production-lifecycle`, `evidence-graph`, `source-authoring`, and `review-verification` skills. That includes the author's own rendered Self-Review and every stage transition. When a rule about the work seems missing, the gap belongs to the [scaffold](../scaffold/SKILL.md), never to a benchmark brief or to this skill.

Do not attach a separate, paired, or adversarial reviewer agent to judge the production. The authoring agent looks at its own renders, judges them, repairs, and advances its own stages under the shipped skills. The user decided this on 2026-09-28, after a separate reviewer turned into the defect-finding step and the writers stopped checking their own work.

The supervisor's work is:
- create and refresh the sandbox;
- launch and resume sessions and keep them alive;
- relay the user's directives unchanged;
- record the run;
- report what was observed.

It writes no production source, sends no method, and issues no verdict on the work.

Read the [project](../project/SKILL.md) and [scaffold](../scaffold/SKILL.md) skills before driving a sandbox. Read the [viewer-verification](../viewer-verification/SKILL.md) skill before claiming anything about a render.

## Create The Sandbox

Choose one explicit, disposable path under `experimental/` for the authorized question. Resolve its absolute location and inspect any existing content before creation or replacement. The committed manor is not a disposable target. A production that is kept graduates by becoming a committed workspace member the website imports; that is a separate decision.

Create it with the ordinary project creator described by the [CLI surface](../../../packages/cli/README.md#cli-surface), using the requested language. For a working-tree experiment, invoke the CLI and template built from the revision under investigation rather than a registry release. The scaffold's [ownership contract](../../../packages/template/scaffold/README.md#ownership) applies inside the sandbox.

Install the package generation through ordinary package-manager commands. Record the exact revisions, resolved entry points, and dependency versions before launch. When dependencies change, preserve the authored production, rebuild and reinstall the affected generation, and verify what the sandbox actually resolves. Recreating a blank scaffold over existing work is not a dependency refresh.

Keep the sandbox out of `pnpm-workspace.yaml` so it adds no importer to the repository lockfile. Verify the installed dependency closure, including transitive workspace packages, before reading a sandbox failure as a product defect. Read the invoked command's exit code directly, not a filter's.

Delete the sandbox and its temporary scripts, logs, and captures when the question is answered. Retain only the findings and records the owning workflow needs. Never commit disposable content, hide it behind a broad ignore rule, or leave it as untracked clutter.

## Drive It

A sandbox is an ordinary project, so attaching is starting there:

```bash
cd experimental/<name>
claude          # or: codex
```

Give the agent a brief and let it work. Do not write its source or run its scripts for it; the point is to see what the project affords a model that has only the shipped skills, the contracts, and the builder's refusals. Resume by naming the session: `claude -p "<next turn>" --resume <uuid>`, or `codex exec resume <session-uuid> "<next turn>"`.

- [briefing.md](briefing.md) owns what the brief and later messages may say.
- [steering.md](steering.md) owns keeping a long session alive: turn boundaries, delivery, process identity on a shared machine, and the supervisor's own instruments.
- [records.md](records.md) owns the durable record before launch, during the run, and at close.

## Several Productions At Once

Several units under one harness are several experiments, not one repeated. Freeze the common harness, shipped skills, and package generation before the first session starts. Give each production its own sandbox, and never let one unit use another unit's evidence. Run exactly one liveness supervisor for the whole run, so no writer receives contradictory instructions from two supervisors. Prefix every shared file, lock, and scratch name with its owner; [One Machine, Several Campaigns](steering.md#one-machine-several-campaigns) applies in full.

Read liveness from artifacts, not from self-report: the session process, transcript growth, and disk changes, as [steering.md](steering.md#your-own-instruments-fail-plausibly-too) describes. Element counts and elapsed time tell you where to look; they never rank productions or carry a causal claim.

## Read The Result

Judge against what the experiment set out to answer, and say plainly when the run did not settle it.

- Separate what the engine accepted from what the render shows. Verify anything visual through the viewer-verification skill rather than a tool's success return.
- Verify the instrument before the subject. A capture loop or comparison script you wrote is covered by nothing the engine guarantees. Say how each claim was obtained.
- Ask the model rather than your own index. What you did not see is a question until you have asked the model the way it is organized.
- Reproduce before believing. The engine is deterministic; the driving model is not.
- Keep repetition inside the claim ceiling that [records.md](records.md#declare-the-causal-ceiling) owns.
- Record a suspicion the run cannot settle as a hypothesis, with the observation that would confirm it.

Never adjust the sandbox to make a result look better.

## When An Observation Becomes Work

An experiment may end with nothing but an answer. Publish an issue only when the observation survives fact-checking against the real code path, following the [issue-campaign skill's Self-Contained Issue Body](../issue-campaign/SKILL.md#self-contained-issue-body).

An engine defect, a missing contract axis, a refusal that does not say what to do, and a gap in a shipped skill are automovie's to fix. A model-side failure against an adequate surface is not. Write an issue's approach as a hypothesis and say what it rests on.

If the question needs systematic measurement rather than one run, stop and say so.
