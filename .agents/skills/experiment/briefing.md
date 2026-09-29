# Briefing A Benchmark

Read this document when the experiment is a benchmark: an external agent authors a whole production over many rounds while you supervise. [steering.md](steering.md) owns the running session. This document owns what you tell the agent: what the brief says, what it leaves out, and what may go into a message afterwards.

A single-prompt experiment needs none of this. There the brief is the question.

The brief states the target, not the method. How the production is authored, reviewed, staged, and judged belongs to the generated project's shipped skills ([Supervision Only](SKILL.md#supervision-only)), so a brief never restates, overrides, or supplements them.

## What The Brief Names

Settle these before the first turn. A brief edited mid-run can no longer be rerun.

1. The subject and the references it answers to, and which of the two governs where they disagree.
2. The condition that ends the run.
3. The supervisor's boundary: what you will do (launch, keep alive, relay the user's directives, record) and what you will not (author, review, stage, judge, or send method).

## Say Which Source Governs When Two Disagree

The subject and its references disagree more often than expected. One campaign's fixed massing said "one main body, one garage, nothing else" while the reference showed a chimney; its fixed circulation named a straight flight while the reference showed a dog-leg stair. Both times the agent stopped and asked, and the driver had to decide mid-run a question the brief should already have answered.

So the brief names the rule once: **which source governs, and for what.** A contradiction decided mid-run cannot be rerun. An agent that meets one with no rule either stops, costing a turn, or picks, which silently makes the brief mean whatever it picked.

Whether the agent asks or decides on such a contradiction is a property of the run: the model, its effort, and the harness's own autonomy instruction. Read a stop-and-ask or a decide-and-continue against the frozen basis that [records.md](records.md#freeze-identity-before-launch) requires, not as what the surface afforded.

## Withhold The Method

Give the agent the target and the evidence: what the thing is and what it has to end up looking like. Withhold how to build it. The route the agent takes is the observation.

Withholding fails at the filesystem before it fails at the prompt. Keep every operational document outside the work root; the brief is what the agent may read. A sandbox under `experimental/` sits inside this repository's git root, and Codex discovers `.agents/skills/` from that root. What leaks that way is the repository's engineering practice. No brief can withhold it, so record it as a condition of the run.

## Naming A Tool Spends The Measurement

Decide before turn one whether the run measures what an agent does with the tools or whether it finds them. The brief can buy only one. A tool named once is named for the whole session, so a later turn is not a control for an earlier one. That includes anything quoted back from the product: its own diagnostics name its tools.

## Send Observations, Not Causes

Report what you measured and where. Name a cause only when you have read the code path that produces it, which as the supervisor you usually have not. A diagnosis sent as an instruction overrides the shipped skills the agent works under without either of you noticing. Say how you obtained each claim, so the agent can challenge the frame it came from ([steering.md](steering.md#the-agent-will-rebut-you-and-may-be-right)).

A user directive is the exception. Relay it verbatim and immediately; it outranks the brief.

## Build The Instrument And Its Baseline Before The First Turn

If you observe with an instrument of your own, such as a fixed camera set or a capture loop, build it and prove it against a known count before the agent starts, and take round zero with it. An instrument that draws with its own camera must resolve the instanced tiers for that camera first. One campaign's sweep dropped every instanced population for four rounds and still showed a plausible picture.

## Say What Ends The Run

Name the closing condition and the reference set it is checked against. Your own list going empty is not one; ask the agent for its list too ([steering.md](steering.md#ask-for-its-list-when-yours-is-empty)).

## Run The Same Brief Twice

Before treating one run as a stable product observation, run the same brief again, byte for byte, in a fresh sandbox. A second run can expose variability and disprove a universal account. Agreement shows only consistency under the observed condition. [The causal ceiling](records.md#declare-the-causal-ceiling) governs any stronger claim. Byte for byte identical is why the brief is a file.

## Keep The Roles Apart

| Role | Owns | Does not |
| --- | --- | --- |
| Supervisor | The sandbox, launches, liveness, relaying user directives, measurement, and records | Write production source, send method, review or judge the production, or advance its stages |
| Authoring agent | The production: authoring, its own rendered Self-Review, repairs, and stage transitions under the shipped skills | Change repository code |
| Repository issue owner | One issue the benchmark produced, under the [issue-campaign skill](../issue-campaign/SKILL.md) | Steer the benchmark |

State the supervisor and authoring-agent rows in the brief, because the agent cannot respect a boundary it was never told.

## Carry The Numbers Forward As Evidence

A finished benchmark's numbers describe one subject, one authoring agent, and one duration. They are evidence for the next brief, not constants in it. Record what the run did not cover beside what it found.
