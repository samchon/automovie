# Briefing A Benchmark

Read this document when the experiment is a benchmark: an external agent authors a whole production over many rounds while you supervise. [steering.md](steering.md) owns the running session, and this document owns what you tell the agent: the brief, and what a later message may say. A single-prompt experiment needs none of it, because there the brief is the question.

The brief states the target and never the method. How the production is authored, reviewed, staged and judged belongs to the generated project's shipped skills ([Supervision only](SKILL.md#supervision-only)), so a brief never restates, overrides or supplements them.

## What the brief names

Settle these before the first turn, because a brief edited mid-run can no longer be rerun:

1. The subject and the references it answers to, and which of the two governs where they disagree.
2. The condition that ends the run, and the reference set it is checked against. Your own list going empty is not one.
3. The supervisor's boundary: what you do (launch, keep alive, relay the user's directives, record) and what you do not (author, review, stage, judge or send method).

Name once **which source governs, and for what**. A subject and its references disagree more often than expected, for example a fixed massing that allows one main body while the reference shows a chimney. An agent that meets a contradiction with no rule either stops, which costs a turn, or picks, which silently makes the brief mean what it picked. Whether an agent asks or decides depends on the model, its effort and the harness's autonomy instruction, so read a stop or a continue against the frozen basis that [records.md](records.md#freeze-identity-before-launch) requires and not against what the surface afforded.

## Withhold the method

Give the agent the target and the evidence: what the thing is and what it has to end up looking like. The route the agent takes is the observation.

Withholding usually fails at the filesystem, before the prompt is read. Keep every operational document outside the work root. A sandbox under `experimental/` sits inside this repository's git root, and Codex discovers `.agents/skills/` from that root, so the repository's engineering practice leaks in. No brief can withhold it, so record it as a condition of the run.

Naming a tool removes the measurement of whether the agent finds it. Decide before turn one whether the run measures what an agent does with the tools or whether it finds them, because a tool named once is named for the whole session, including anything quoted back from the product's own diagnostics.

## Send observations

Report what you measured and where. Name a cause only from a code path you have read, which as supervisor you usually have not. A diagnosis sent as an instruction overrides the shipped skills without either of you noticing. Say how you obtained each claim so the agent can challenge the frame it came from.

A user directive is the exception. Relay it verbatim and at once, because it outranks the brief.

Decide per item what to say. Pre-announce what would cost a turn to misread, such as a capture after a repack refusing until the production is recompiled. Withhold what the agent's reading of it is the measurement of, and remember that telling the agent about a defect you found removes the chance to observe it: when you want to know whether the product's own gate catches a class, run the gate first, or send the trace and record that the gate is now untested for that class. Relay a tool's output whole, or say which part you cut.

A borrowed number becomes a target and then measures itself. State the outcome you want (nothing important still reads as a bare box) and no element count, because an author given a number reaches it.

## Build the instrument and its baseline first

If you observe with an instrument of your own, such as a fixed camera set or a capture loop, build it and prove it against a known count before the agent starts, and take round zero with it. An instrument that draws with its own camera must resolve the instanced tiers for that camera first, or it drops every instanced population and still shows a plausible picture.

## Run the same brief twice

Before treating one run as a stable observation, run the same brief again, byte for byte, in a fresh sandbox. Keeping the brief as a file makes that possible. A second run can expose variability and disprove a universal account, and agreement shows consistency under the observed condition only. [The causal ceiling](records.md#declare-the-causal-ceiling) governs any stronger claim.

## Keep the roles apart

| Role | Owns | Does not |
| --- | --- | --- |
| Supervisor | The sandbox, launches, liveness, relaying user directives, measurement and records | Write production source, send method, review or judge the production, or advance its stages |
| Authoring agent | The production: authoring, its own rendered Self-Review, repairs and stage transitions under the shipped skills | Change repository code |

State the supervisor and authoring-agent rows in the brief, because the agent cannot respect a boundary it was never told. An issue the benchmark produces is handled under the [issue-campaign skill](../issue-campaign/SKILL.md) and never steers the benchmark.

## Carry the numbers forward as evidence

A finished benchmark's numbers describe one subject, one authoring agent and one duration. They are evidence for the next brief and not constants in it. Record what the run did not cover beside what it found.
