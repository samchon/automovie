---
name: experiment
description: Defines how automovie supervises an ad-hoc experiment or benchmark: creating a disposable source-linked sandbox under experimental/, launching and steering a live Claude Code or Codex session that authors inside it against working-tree code, keeping it alive, relaying the user's directives, recording the run, and deciding what an observation is worth. It is a supervision overview and prescribes nothing about how the production is authored, reviewed, staged, or judged, which the generated project's shipped scaffold skills own. Use when the user asks to try something out, drive a generated project by hand, run a benchmark against an authoring agent, or see how a change behaves through a real agent. Do not use it to inspect a render of something already running (viewer-verification) or for a repository-wide audit (issue-campaign).
---

# Experiment

An experiment answers one question by running the real thing. Create a disposable sandbox, start a live agent in it, supervise the run, read what happens and throw the sandbox away. It produces an observation and no score.

## Supervision only

This skill supervises. It never tells the authoring agent how to author, review, stage or judge its production. The generated project's shipped skills and contracts own all of that, including the author's own rendered Self-Review and every stage transition. A missing rule about the work is a gap in the [scaffold](../scaffold/SKILL.md) and never a line in a benchmark brief or in this skill.

Attach no separate, paired or adversarial reviewer agent to judge the production. The authoring agent looks at its own renders, repairs and advances its own stages, because a separate reviewer becomes the defect-finding step and the writers stop checking their own work.

The supervisor creates and refreshes the sandbox, launches and resumes sessions and keeps them alive, relays the user's directives unchanged, records the run and reports what was observed. It writes no production source, sends no method and issues no verdict.

Read the [project](../project/SKILL.md) and [scaffold](../scaffold/SKILL.md) skills before driving a sandbox, and the [viewer-verification](../viewer-verification/SKILL.md) skill before claiming anything about a render.

## Create the sandbox

Choose one explicit, disposable path under `experimental/` for the authorized question. Resolve its absolute location and inspect any existing content before creating or replacing it. The four committed productions are not disposable targets, and a production that is kept graduates by becoming a committed workspace member the website imports, which is a separate decision.

Create it with the ordinary project creator in the [CLI surface](../../../packages/cli/README.md#cli-surface), in the requested language. For a working-tree experiment, invoke the CLI and template built from the revision under investigation and not a registry release. The scaffold's [ownership contract](../../../packages/template/scaffold/README.md#ownership) applies inside the sandbox.

Install the package generation with ordinary package-manager commands, and record the exact revisions, resolved entry points and dependency versions before launch. When dependencies change, preserve the authored production, rebuild and reinstall the affected generation, and verify what the sandbox resolves. Recreating a blank scaffold over existing work is no dependency refresh.

Keep the sandbox out of `pnpm-workspace.yaml`, so it adds no importer to the repository lockfile. Verify the installed dependency closure, transitive workspace packages included, before reading a sandbox failure as a product defect, and read the invoked command's exit code and never a filter's.

Delete the sandbox and its temporary scripts, logs and captures once the question is answered, and retain only the findings and records the owning workflow needs. Never commit disposable content, hide it behind a broad ignore rule or leave it as untracked clutter.

## Drive it

A sandbox is an ordinary project, so you attach by starting there:

```bash
cd experimental/<name>
claude          # or: codex
```

Give the agent a brief and let it work. Do not write its source or run its scripts, because the point is to see what the project affords a model that has only the shipped skills, the contracts and the builder's refusals. Resume by naming the session: `claude -p "<next turn>" --resume <uuid>`, or `codex exec resume <session-uuid> "<next turn>"`.

- [briefing.md](briefing.md) owns what the brief and later messages say.
- [steering.md](steering.md) owns keeping a long session alive: turn boundaries, delivery, process identity on a shared machine and the supervisor's own instruments.
- [records.md](records.md) owns the durable record before launch, during the run and at close.

## Read the result

Judge against what the experiment set out to answer, and say plainly when the run did not settle it.

- Separate what the engine accepted from what the render shows, and verify anything visual through the viewer-verification skill and not through a tool's success return.
- Verify your instruments before the subject, as [steering.md](steering.md#verify-your-instruments) requires, and say how each claim was obtained.
- Reproduce before believing: the engine is deterministic and the driving model is not.
- Keep repetition inside the claim ceiling that [records.md](records.md#declare-the-causal-ceiling) owns.
- Record a suspicion the run cannot settle as a hypothesis, with the observation that would confirm it.

Never adjust the sandbox to make a result look better.

## When an observation becomes work

An experiment may end with nothing but an answer. Publish an issue only when the observation survives fact-checking against the real code path, following the [issue-campaign skill's self-contained issue body](../issue-campaign/SKILL.md#self-contained-issue-body).

An engine defect, a missing contract axis, a refusal that does not say what to do and a gap in a shipped skill are automovie's to fix. A model-side failure against an adequate surface is not. Write an issue's approach as a hypothesis and say what it rests on. A question that needs systematic measurement and not one run is outside this skill, so say so.
