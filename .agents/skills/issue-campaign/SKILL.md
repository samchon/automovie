---
name: issue-campaign
description: Defines the repository-wide issue campaign for automovie: exhaustive discovery, wiki-backed candidate adjudication, vetted issue publication, then implementation of every accepted issue in dependency order in one checkout and one branch, closed by one integration Self-Review and CI on a single cycle pull request. Use for broad audits, many issue candidates, or repeated issue-to-pull-request campaigns; do not use for one already-defined issue or an ordinary pull request.
---

# Issue Campaign

A campaign repeats one cycle: exhaustive discovery, issue publication, one unified implementation pull request, and renewed discovery. You do all of it yourself, in one checkout on one branch.

## Completion

The campaign is complete only when all of these hold:

- one complete fresh full-scope discovery round produces no meaningful candidate after fact-checking;
- no accepted or published campaign issue remains unresolved;
- no campaign pull request, branch, process or temporary asset remains;
- the target checkout is clean and synchronized.

An external blocker that makes these impossible means the campaign is reported as blocked and not as complete.

## Authority

The user's requested phase boundary controls how far to proceed. An audit-only request does not permit publishing issues, pushing branches, opening pull requests or merging. A standing autonomous mandate (see the [pull-request skill](../pull-request/SKILL.md)) authorizes only the remote actions it names.

A campaign's scale and duration demand stronger evidence and deeper consequence analysis and never justify admitting an unverified candidate or accepting a weaker standard, as AGENTS.md's [principled-course rule](../../../AGENTS.md#attitude) requires of every decision.

Read the project, development and review skills first.

## Campaign knowledge base

Create `.wiki/08-campaigns/<campaign>/` with a short filesystem-safe name, in Korean like the rest of `.wiki/`. Reconcile an existing campaign directory instead of deleting it or assuming a blank slate.

Keep concise, current documents for the campaign scope and its architecture, validation ownership, product boundaries and provenance; experiments, reproductions and related issue and pull-request history; every raw candidate with its evidence, dependencies and final disposition; combinations, splits, rejections and deferrals with their evidence; and, when those phases apply, the published-issue DAG, the cycle pull request, CI and Self-Review iterations, blockers, timing and cleanup state.

Record raw candidates before fact-checking, so overlapping observations can be combined, split, rewritten, rejected or deferred without losing why. The knowledge base is not the issue body: `.wiki` is gitignored and a fresh implementer never sees it.

## Discover, adjudicate and publish

Each discovery round follows the [review skill's law](../review/SKILL.md#non-negotiable-review-law) over the entire declared scope:

1. Audit the whole scope: source, tests, documentation, CI, packaging, rendered output, platform behavior, sibling-repository and upstream provenance, and open and closed issue and pull-request history. Source is one evidence layer among several, so also run a generated project's own scripts, render through the viewer under the viewer-verification skill, and inspect upstream behavior, consumers, fixtures, public documentation and closed decisions.
2. Audit the current implementation and its history against the development skill's [Forbidden](../development/SKILL.md#forbidden) section as a retrospective contract and not only a rule for future changes. A violation is a meaningful candidate even when it predates the campaign or passes every test at 100% coverage, and resemblance or stylistic preference proves nothing.
3. Record every raw candidate with its evidence in the knowledge base before adjudication, and discard no suspicion because it looks duplicative or inconvenient.
4. Adjudicate each candidate: reopen its evidence and reproduce the behavior, verify ownership, provenance and any claimed **Forbidden** classification from purpose, control flow, consequence and history, trace the full consequence surface, and compare open and closed issues and pull requests. Record accept, partial acceptance, rewrite, combine, split, reject or defer with the supporting evidence, so later rounds do not rediscover a rejected premise as new.
5. If any meaningful candidate survived, run another complete round over the entire scope at the same repository state. Adjudicate what it produced, re-audit, and repeat until one round adds no meaningful candidate. Only that empty round closes discovery.
6. Publish only the adjudicated form, covering the whole accumulated pool, and only with user authorization or under a standing autonomous mandate.
7. After a merged cycle, begin again at step 1 against the integrated repository with no round limit. Report the campaign complete only from a round that actually came up empty.

A round audits the current integrated state again in full. A merged cycle changes the state every earlier conclusion rested on, so what an earlier round read is not coverage for this one. Stopping at the first productive round only defers the issues a second round would have found to a later cycle, where they sit on top of the edits the first cycle landed and their fix must account for work that did not exist when it was written.

### Self-contained issue body

Write enough context for a fresh AI agent to implement from the issue alone, without the local `.wiki`, the discovery conversation or unstated repository knowledge. Cover these sections when they apply; **Scope** is always present:

- **Problem:** current and expected behavior, impact and affected users.
- **Evidence:** exact reproduction, outputs or renders, stable symbols, verified root cause, ownership and provenance. For a **Forbidden** violation, prove the classification from behavior, control flow and history instead of naming the prohibition. Line numbers are navigation and not proof.
- **Consequence surface:** affected consumers, states, platforms, compatibility and failure paths, plus the complete case matrix for the cause.
- **Approach:** the invariant and architectural owner, without prescribing an unverified implementation.
- **Scope:** every layer this topic crosses, each answered, as [An issue stands vertically](#an-issue-stands-vertically) requires.
- **Acceptance and verification:** positive, negative, boundary and regression outcomes with narrow and broader proving commands.
- **Coordination:** dependencies, exclusions, migration concerns, blockers and related open, closed, accepted or rejected work.

Use tables for repeated case mappings. Read the rendered issue back and keep its body as the current operative handoff, with comments only for chronology.

### An issue stands vertically

An issue is one topic, not one package. Walk the topic down the contract before publishing and answer every layer in the body, because an issue that claims one layer and calls the rest separate hands its implementer a package-shaped fragment.

| Layer | What the body answers |
| --- | --- |
| `docs/requirements` | Which requirement already promises this capability, or which promise the topic adds |
| `docs/specifications` | Which specification makes that promise precise |
| `packages/*` | Which package owns the logic, and which anchors its public exports cite |
| Sandbox engine surface | Whether authoring source has to call it, and through which surface entry and bridge |
| `packages/template/scaffold/.agents/skills` | How an authoring agent comes to know the capability is there |
| Tests | Reachability and the negative twin, not the logic alone |

The table is the floor. A topic that also crosses the scaffold, the viewer, CI, the evidence configuration or a skill lists that layer beside the six. "Not applicable" is an answer and silence is not: write the layer down with the reason, because a layer the body never mentions is a layer nobody decided about.

Point at the skill that owns each layer's obligation and copy none of it. The [evidence graph skill](../evidence-graph/SKILL.md) owns the two document layers and how a public export cites them, the [scaffold skill](../scaffold/SKILL.md) owns the authoring skill a generated project ships, and the development skill's [producer-lands-with-its-consumer rule](../development/SKILL.md#work-rules) owns reachability inside one change.

The failure this prevents is a capability that exists and cannot be reached. Published, documented and reachable are three different states, so the guide layer answers how an author arrives at the capability and not whether its name appears somewhere.

### Read the upper layer first

Answer the layers downward, from `docs/requirements` toward the tests. Starting at the code and back-filling documents turns a requirement into a description of what was already built and points the evidence graph the wrong way. Reading the requirements first also changes what the issue is: a capability that looks new is often an unmet promise, which carries different acceptance and a different fix. The review skill's ["It is missing" rule](../review/SKILL.md#it-is-missing-is-a-claim-that-needs-its-own-evidence) settles which.

## Develop and repeat

When the user authorizes implementation pull requests, or a standing autonomous mandate covers them, read [development.md](development.md) in full. It owns the one-PR cycle, the empty claim, dependency order, implementation, validation, red-CI repair, merge, cleanup and the return to discovery.

An audit-only or publication-only campaign does not load that procedure and changes no repository or GitHub state beyond the authorized publications.
