# Recording A Benchmark Campaign

Read this document before launching a benchmark. It owns the durable record, the causal claim ceiling and the run protocol. [briefing.md](briefing.md) owns what the authoring agent sees, and [steering.md](steering.md) owns live-session mechanics. The record never judges the production, because the authoring agent's shipped skills own that.

Start from the repository's [experiment campaign issue template](../../../.github/ISSUE_TEMPLATE/experiment-campaign.md). The issue is the self-contained launch contract and durable conclusion. Live operational notes may stay in `.wiki`, generated evidence stays with its production, and measurements that must outlive a deleted sandbox belong in the issue. Chat history and private notes are never the only carrier of a run fact.

## Reconcile the operative handoff

Before a new run, reconcile its issue body with the selected repository head and the canonical procedures it names: sandbox creation through the [experiment router](SKILL.md#create-the-sandbox), session identity through [steering](steering.md), and authoring, commands and capture prerequisites through the generated project's own instructions and manifest. A copied command in an old issue is no alternative owner. Correct the operative body, note the correction in a comment, and preserve the user-selected subject, model and driver, input references and launch-authorization boundary. Remove any stale role assignment that attaches a separate reviewer agent to the production.

A resumed frozen run belongs to its recorded harness and not to today's repository. Adopting a changed harness creates a successor under [the run state machine](#operate-one-frozen-run-as-a-state-machine), and updating an issue never upgrades an old run's provenance or result. Fill the current campaign template before a new launch: an inherited proposal with missing fields is a proposal to complete and not a ready run. Keep unsupported actual values `unverified` with their reasons. Correcting the handoff grants no permission to launch.

## Freeze identity before launch

Give the campaign, every subject, condition, experimental unit, run, record and receipt a stable id. A run records one `subjectId`, one `conditionId` and one `replicateId`, unique within that subject and condition. A different subject is a different unit and never another replicate.

Freeze and digest the brief, repository head, packed package set, harness and skill revisions, model, reasoning effort, tool versions, policy, working and readable roots, network mode, input bytes, observation plan, and the planned runtime and resource envelope. Record the actual model, effort, tools, roots, network behavior, elapsed time and resource use beside the plan. An unsupported or unreadable actual value is `unverified` with the reason and never a copy of the plan.

Use `disabled`, `controlled` or `open` as the retrieval mode. A controlled or open run declares allowed and denied domains, exposure limits and the information the authoring agent must not receive, and each retrieval receipt carries a sanitized query, resulting URL, timestamp, actor, purpose and disposition. Record no credential value or key name.

Retain only observable trajectory material: user and assistant messages, visible tool calls and results, timestamps and process outcomes, never hidden reasoning. The trajectory manifest records source, format version, byte length, digest, first and last timestamp, storage location, retention period, access boundary, redactions and privacy disposition. A copied or redacted trajectory gets a transfer receipt binding source and destination digests and stating every transformation.

Run preflight against the exact launch paths and runtime. On Windows, record whether legacy `MAX_PATH` or long-path-aware behavior applies, the effective limit, the longest resolved sandbox, temporary, artifact and session path, and the headroom, and refuse launch when the harness cannot prove every planned path fits. Record the readable root and what it exposes. A sandbox lives under `experimental/`, so the repository and its history are readable by construction.

## Declare the causal ceiling

A repetition under one condition measures consistency and variability under that condition. It does not identify whether the authoring agent, brief, model, harness or product caused the result. Set the strongest allowed disposition before reading the outcome:

| Design | Allowed disposition | Claim ceiling |
| --- | --- | --- |
| One subject, one condition, one run | `exploratory` or `provisional` | One observation and a follow-up hypothesis |
| One subject, one condition, independent repeated runs | `consistency-only` or `variability-found` | Agreement or variation within the observed condition, with uncertainty |
| Different subjects under one harness | `exploratory` | Breadth observations for the named subjects |
| Several productions without a comparator | `exploratory` | Cross-work patterns and follow-up hypotheses |
| One subject, a predeclared comparator, independent repetition in both conditions, and exactly one changed axis | `controlled-comparison` | The named contrast on the named subject |
| Unclear condition identity or observation plan | `inconclusive` | No causal or aggregate score claim |

A controlled comparison names exactly one `changedAxis` and freezes the remaining `invariantBasis`. Any uncontrolled difference is a limitation and lowers the ceiling, and the contrast is never generalized to an unobserved axis or population.

Record exactly one disposition for every terminal run or comparison, and verify it does not exceed the predeclared ceiling. There is no global sample size or metric: state why the chosen repetition suffices for this question, outcome shape, expected heterogeneity, cost and failure risk. Two runs remain the minimum reproduction probe for a universal claim and are no proof of a cause.

## Operate one frozen run as a state machine

A run starts at `declared` and ends in exactly one terminal state: `completed`, `failed`, `interrupted` or `abandoned`. The allowed edges are `declared -> preflight | abandoned`, `preflight -> ready | failed | abandoned`, `ready -> running | failed | abandoned` and `running -> completed | failed | interrupted | abandoned`. This lifecycle is the supervisor's record. The production's own stages are the authoring agent's and are never transitions here. A condition or immutable basis never changes in place, and changing one creates a successor run with a new id and an explicit predecessor link.

Each transition receipt records its id, a monotonic sequence, run id and generation, from and to states, timestamp, actor, reason, evidence identities and result. A transition is invalid when it uses an unlisted edge, follows a terminal state, changes the frozen basis or has no receipt. A replacement generation never covers, edits or deletes the interrupted generation's record.

The supervisor samples every active unit on a predeclared cadence and timer. Each liveness receipt records its id and monotonic sequence, the process identity and creation time, transcript growth, the artifact signal chosen from the turn's requested deliverable, last progress time, timer deadline and one disposition: `alive`, `idle`, `stalled`, `finished` or `unknown`. An out-of-order sample or a timer expiry without a disposition is an operational failure. The authoring agent's self-report and a wrapper notification are observations and never terminal evidence.

Create an intervention receipt before acting. It names the run and generation, owner, timestamp, evidence, reason, intended action, affected process or artifact identities and recovery boundary, and it is closed afterwards with the exact action, result, terminal or successor state, process exit evidence, preserved artifacts and cleanup result. A silent kill, restart or replacement is invalid even when the replacement succeeds.

Only the supervisor changes lifecycle state. Before a replacement, mark the old generation `interrupted` or `failed`, close its intervention, and issue a notice naming what the successor inherits and must re-establish. Never backcast evidence from the successor into its predecessor.

The close audit lists every launched process, session, sandbox, temporary path, external registration, receipt, unresolved timer and preserved artifact. It proves that every run is terminal, every intervention is closed, every retained record has a privacy disposition, and every owned process and temporary resource is removed or transferred to a named owner. A leaked process, a missing replacement receipt, a partial transfer or an unresolved timer prevents campaign closure.

## Validate the record before launch and close

Read the filled issue and records against these invalid patterns. This is a manual contract check and no source-text test.

- Different subject ids counted as one replicate group; a causal product, brief, model or authoring-agent claim without a comparator; a controlled comparison with two changed axes or no repetition in one condition; a fixed global sample size or a mandatory binary metric for visual judgment.
- A resumed run silently adopting today's harness; planned values copied into missing actual fields; a run launched before preflight; a replacement that overwrites or lacks an interrupted predecessor and notice; a planned path exceeding the recorded path limit.
- A retrieval-enabled run without policy and sanitized receipts; a trajectory digest without retention, privacy or hidden-reasoning exclusion.
- An out-of-order liveness sample or an unresolved timer; an intervention recorded only after the action or left without its closing half; a launched process without a final disposition and cleanup or transfer owner.
- A separate reviewer agent attached to judge or gate the production.

Valid examples include one exploratory run with its limitation and follow-up, one subject and condition with two unique replicates under an identical frozen basis and a `consistency-only` conclusion, a stale launch issue corrected before a new run with the prior records and authorization boundary preserved, and a completed run with every transition, transfer and close-audit receipt linked.

Open every link, recalculate every digest and count from its named artifact, and read the record as a self-contained handoff. Mark a field that cannot be verified `unverified` with its reason, and never invent a value after the run.
