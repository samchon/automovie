# Recording A Benchmark Campaign

Read this document before launching a benchmark or a campaign of several units. It owns the durable record, the causal claim ceiling, and the operation protocol. [briefing.md](briefing.md) owns what the writer sees, [steering.md](steering.md) owns live-session mechanics, and [the experiment skill](SKILL.md#several-productions-at-once) owns several units under one harness. The record never judges the production; the authoring agent's shipped skills own that ([Supervision Only](SKILL.md#supervision-only)).

Start from the repository's [experiment campaign issue template](../../../.github/ISSUE_TEMPLATE/experiment-campaign.md). The issue is the self-contained launch contract and durable conclusion. Live operational notes may stay in `.wiki`, generated evidence stays with its production, and measurements that must outlive a deleted sandbox belong in the issue. Chat history and private notes are never the only carrier of a run fact.

## Reconcile The Operative Handoff

Before a new run, reconcile its issue body with the selected repository head and the canonical procedures it names. Read sandbox creation and refresh through [the experiment router](SKILL.md#create-the-sandbox), session identity through [steering](steering.md), and authoring, commands, and capture prerequisites through the generated project's own instructions and manifest. A copied command or contract in an old issue is not an alternative owner. Correct the operative body and record the correction in a comment while preserving the user-selected subject, model and driver, input references, and launch-authorization boundary. Reconcile procedural role assignments with [the role table](briefing.md#keep-the-roles-apart); a stale assignment that attaches a separate reviewer agent to the production is removed, not preserved.

A resumed frozen run still belongs to its recorded harness, not to today's repository. Read its pinned instructions and preserve its earlier observations. Adopting a changed harness creates a successor under [the run state machine](#operate-one-frozen-run-as-a-state-machine); updating an issue never upgrades an old run's actual provenance or result.

Fill the current campaign template before a new launch. An inherited proposal with missing fields is a proposal to complete, not a ready run. Keep unsupported actual values `unverified` with their reasons, and use [the record matrix](#validate-the-record-before-launch-and-close) to decide readiness. Correcting the handoff grants no permission to launch.

## Freeze Identity Before Launch

Give the campaign, every subject, condition, experimental unit, run, record, and receipt a stable id. A run records one `subjectId`, one `conditionId`, and one `replicateId`; the replicate id is unique inside that subject and condition. A different subject is a different experimental unit, not another replicate of the same condition.

Freeze and digest the brief, repository head, packed package set, harness and skill revisions, model, reasoning effort, tool versions, policy, working and readable roots, network mode, input bytes, observation plan, and planned runtime and resource envelope. Record the actual model, effort, tools, roots, network behavior, elapsed time, and resource use beside the plan. An unsupported or unreadable actual value is `unverified` with the reason, never a copy of the plan.

Use `disabled`, `controlled`, or `open` as the retrieval mode. A controlled or open run declares allowed and denied domains, exposure limits, and the information the writer must not receive. Each retrieval receipt carries a sanitized query, resulting URL, timestamp, actor, purpose, and disposition. Record no credential value or credential key name.

Retain only observable trajectory material: user and assistant messages, visible tool calls and results, timestamps, and process outcomes. The trajectory manifest records the source, format version, byte length, digest, first and last timestamp, storage location, retention period, access boundary, redactions, and privacy disposition. Hidden reasoning is excluded. A copied or redacted trajectory gets a transfer receipt that binds source and destination digests and states every transformation.

Run preflight against the exact launch paths and runtime. On Windows, record whether legacy `MAX_PATH` or long-path-aware behavior applies, the effective path limit, the longest resolved sandbox, temporary, artifact, and session path, and the remaining headroom; refuse launch when the harness cannot prove that every planned path fits. Record the readable root and what it exposes rather than requiring it to exclude this repository: a sandbox lives under `experimental/`, so the repository and its history are readable by construction and blindness to being in an experiment is spent before the first turn.

## Declare The Causal Ceiling

A repetition under one condition measures consistency and variability under that condition. It does not identify whether the writer, brief, model, harness, or product caused the result. Use this matrix to set the strongest allowed disposition before reading the outcome.

| Design | Allowed disposition | Claim ceiling |
| --- | --- | --- |
| One subject, one condition, one run | `exploratory` or `provisional` | One observation and a follow-up hypothesis |
| One subject, one condition, independent repeated runs | `consistency-only` or `variability-found` | Agreement or variation within the observed condition, with uncertainty |
| Different subjects under one harness | `exploratory` | Breadth observations for the named subjects |
| Several productions without a comparator | `exploratory` | Cross-work patterns and follow-up hypotheses |
| One subject, a predeclared comparator, independent repetition in both conditions, and exactly one changed axis | `controlled-comparison` | The named contrast on the named subject |
| Unclear condition identity or observation plan | `inconclusive` | No causal or aggregate score claim |

A controlled comparison names exactly one `changedAxis` and freezes the remaining `invariantBasis`. Any uncontrolled difference is a limitation and lowers the claim ceiling. Never generalize the contrast to an unobserved axis or subject population.

The disposition is part of the result record, not an inference from the design row. Record exactly one of `exploratory`, `provisional`, `consistency-only`, `variability-found`, `controlled-comparison`, or `inconclusive` for every terminal run or comparison and verify that it does not exceed the predeclared ceiling.

There is no global sample size or metric. State why the chosen repetition is enough for this question, outcome shape, expected heterogeneity, cost, and failure risk. Two runs remain the minimum reproduction probe for a universal claim, not proof of a cause.

## Operate One Frozen Run As A State Machine

One run starts at `declared` and ends in exactly one terminal state: `completed`, `failed`, `interrupted`, or `abandoned`. The allowed edges are `declared -> preflight | abandoned`, `preflight -> ready | failed | abandoned`, `ready -> running | failed | abandoned`, and `running -> completed | failed | interrupted | abandoned`. The run's lifecycle is the supervisor's record; the production's own stages are the authoring agent's and are never transitions of this machine. A condition or immutable basis never changes in place; changing one creates a successor run with a new id and an explicit predecessor link.

Each transition receipt records its id, a monotonic sequence, run id and generation, from and to states, timestamp, actor, reason, evidence identities, and result. A transition is invalid when it uses an edge not listed above, follows a terminal state, changes the frozen basis, or has no receipt. A replacement generation never covers, edits, or deletes the interrupted generation's record.

The observer samples every active unit on a predeclared cadence and timer. Each liveness receipt records its id and monotonic sequence, the process identity and creation time, transcript growth, artifact signal chosen from the turn's requested deliverable, last progress time, timer deadline, and one disposition: `alive`, `idle`, `stalled`, `finished`, or `unknown`. An out-of-order sample or timer expiry without a recorded disposition is an operational failure. Writer self-report and a wrapper notification are observations, not terminal evidence.

Create an intervention receipt before acting. It names the run and generation, owner, timestamp, evidence, reason, intended action, affected process or artifact identities, and recovery boundary. Close it afterwards with the exact action, result, terminal or successor state, process exit evidence, preserved artifacts, and cleanup result. A silent kill, restart, or replacement is invalid even when the replacement succeeds.

Only the coordinator changes lifecycle state. Before a replacement, mark the old generation `interrupted` or `failed`, close its intervention, and issue a notice that names what the successor inherits and what it must re-establish. Never backcast evidence from the successor into its predecessor.

The close audit lists every launched process, session, sandbox, temporary path, external registration, receipt, unresolved timer, and preserved artifact. It proves that every run is terminal, every intervention is closed, every retained record has a privacy disposition, and every owned process and temporary resource is removed or transferred to a named owner. A leaked process, missing replacement receipt, partial transfer, or unresolved timer prevents campaign closure.

## Validate The Record Before Launch And Close

Use this synthetic matrix against the filled issue and records. It is a manual contract check, not a source-text or repository-shape test.

| Probe | Expected result |
| --- | --- |
| One subject and condition with two unique replicate ids, identical frozen basis, and a `consistency-only` conclusion | Valid |
| Different subject ids counted as one replicate group | Invalid |
| A causal product, brief, model, or writer claim without a comparator | Invalid |
| A controlled comparison with two changed axes or no repetition in one condition | Invalid |
| One exploratory run with its limitation and follow-up observation | Valid |
| A fixed global `N` or mandatory binary metric for visual judgment | Invalid |
| A stale launch issue corrected before a new run, with prior frozen records and the launch-authorization boundary preserved | Valid |
| A resumed run silently adopting today's harness or missing actual values copied from its plan | Invalid |
| A retrieval-enabled run without policy and sanitized receipts | Invalid |
| A trajectory digest without retention, privacy, or hidden-reasoning exclusion | Invalid |
| Planned values copied into missing actual fields | Invalid |
| A run launched before preflight or a replacement that overwrites its predecessor | Invalid |
| An out-of-order liveness sample or timer expiry without a disposition | Invalid |
| An intervention recorded only after the action or left without its closing half | Invalid |
| A replacement without an interrupted predecessor and replacement notice | Invalid |
| A planned path that exceeds the recorded effective path limit | Invalid |
| A launched process without a final disposition or cleanup/transfer owner | Invalid |
| A completed run with all transition, transfer, and close-audit receipts linked | Valid |
| A separate reviewer agent attached to judge or gate the production | Invalid |

Open every link, recalculate every digest and count from its named artifact, and read the record as a self-contained handoff. A field that cannot be verified is marked `unverified` with its reason. Do not repair a missing observation by inventing a value after the run.
