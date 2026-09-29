---
name: review
description: Defines exhaustive review and Self-Review for automovie. Use for every self-review or unqualified review request and as the review procedure inside issue campaigns. Every review covers one whole declared surface and repeats fresh rounds until a complete round finds nothing.
---

# Review

## Non-Negotiable Review Law

Perform every review in this skill yourself, from scratch, over the entire declared surface.

A review's duration, difficulty and consequence surface are reasons to inspect more deeply, never to pass over a sound improvement, accept an unsupported claim or lower the completion standard, as AGENTS.md's [principled-course rule](../../../AGENTS.md#attitude) requires of every decision.

A complete round satisfies all four rules:

- **Whole surface:** read every changed file and hunk, or for a discovery round the entire declared scope. Never partition by file, package, concern, platform or round.
- **Consequence surface:** inspect affected code paths, tests, rendered output, CI, packaging, documentation and consumers. Trace side effects, state transitions, determinism, numeric and quaternion behavior, Windows and POSIX behavior, public API compatibility, boundaries, and failure and recovery paths beyond the named symptom or diff.
- **Fresh start:** use the current state and repeat the whole inspection. Earlier rounds, sampled files and a recheck of only the latest fix do not count as coverage.
- **Unlimited rounds:** whenever you apply an improvement, update the work and start another complete round. Stop only after a complete round produces nothing that survives verification.

## Review records belong to the procedure

AutoMovie has no repository review service, finding ledger, approval state or waiver store. The record is the Git and pull-request chronology this skill produces. A generated production follows its shipped [production review procedure](../../../packages/template/scaffold/.agents/skills/review-verification/review.md), and neither workflow invents a second ledger.

Declare the branch, base and head, working-tree state, artifact revision, and the file or rendered-output population the round reads. A conclusion applies only to that surface: a clean check, an empty finding set, elapsed time or a judgment over one file never implies wider approval.

Write each finding at the narrowest reproducible location: changed line, public symbol, test case, diagnostic, target identity, frame, interval, subject or render view. Separate what was observed, what the contract requires, the consequence, and any cause proved from control flow or history; an unproved cause stays a hypothesis. Classify a verified finding by affected contract or behavior, impact, reproduction conditions and repair priority (impact and priority are different facts). Several manifestations may share one root cause, and each reproducing location remains evidence until the whole class is repaired.

Compare alternatives only when their source, intent, platform, inputs, time position and presentation conditions make the comparison meaningful. Name the common basis and the actual difference, and report the comparison limit when the basis does not match.

Preserve history through commits and formal pull-request reviews. A later correction supersedes an earlier finding without rewriting it. A Self-Review `COMMENT` is a process record, never an approval, rejection, conditional approval or waiver on anyone's behalf.

## Self-Review

Self-Review and an unqualified review request use this workflow:

1. Establish the complete change surface, including the pull request base-to-head diff and any uncommitted changes.
2. Perform one complete round under the Non-Negotiable Review Law. Include correctness and boundaries, numeric and quaternion behavior, determinism, Windows and POSIX behavior, state, public API compatibility, test isolation and the 100% coverage mandate, CI and packaging, and documentation and `.wiki`. Add the [evidence graph skill](../evidence-graph/SKILL.md) for a changed requirement, specification, public citation or graph configuration, the [contracts skill](../contracts/SKILL.md) for a declaration enrolled in a contracts claim (the checker confirms an answer exists and this round judges whether it is true), and the [viewer-verification skill](../viewer-verification/SKILL.md) for anything visual.
3. Reproduce every suspected defect before accepting it.
4. Apply every sound improvement and run the narrowest verification the owning workflow authorizes.
5. If anything changed, restart at step 1 as a fresh full round.
6. Finish only when a complete round finds nothing to improve. Report the final clean round and every verification that could not run.

Self-Review does not authorize creating, pushing, updating or merging a pull request; the pull-request skill owns those.

## "It is missing" is a claim that needs its own evidence

A failed search proves a name was not found, not that a capability is absent or that its absence was unintended. This repository records deliberate omissions in contract JSDoc and the guide corpus, where a grep for the capability does not reach. Complete all four steps before writing that something is missing:

1. Read the contract type's JSDoc, where deliberate exclusions are stated ("the sun direction is an input, not a computation").
2. Search the four shipped authoring skills under `packages/template/scaffold/.agents/skills/{production-lifecycle,evidence-graph,source-authoring,review-verification}/` in the user's vocabulary, because they teach in a director's words (a curtain, a ridge, a reverberant room) and a search by type name finds nothing even where the topic is covered.
3. Check whether related fields already exist and read why. Half a mechanism usually means the other half was deferred under another name.
4. Confirm the probe: verify how the target is spelled, count consumers by exported symbol rather than module filename, and read checked-in source rather than a generated artifact.

When the steps turn up a declared position, the finding becomes "this was deferred, and here is what now lets it be done deliberately within stated bounds", which carries a different burden of proof.

"It is already there" needs the same discipline, because a symbol's existence is not a path's existence. Before writing that a capability exists, confirm that the contract gives an author somewhere to declare it, that the builder or runtime calls it, that the author can reach the symbol, and that the result shows up in a frame or in evidence.

## Let the builder decide what it can

Looking costs frames, attention and a written justification, and every verdict stales when anything upstream moves. Reserve it for what only looking settles.

- Binding, exports, determinism, engine enforcement and error paths are settled by reading the module.
- Identity, references, scope, ownership, ranges and downstream consumability are settled by the records and compile diagnostics.
- Acceptance outcomes are settled by the builder's explicit per-predicate verdict for each authored opening, closing, event, camera, actor and formation predicate.
- Whether a silhouette reads, a performance is credible or a cut lands is settled by frames alone.

A claim that satisfies [falsifiable acceptance](../../../docs/requirements/story/coverage-and-acceptance.md#story-falsifiable-acceptance) is by construction a predicate, and one that needs [scene observability](../../../docs/requirements/story/scenes-and-observable-action.md#story-scene-observability) is by construction pixels. When a review keeps producing the same class of finding, ask whether a diagnostic belongs somewhere else, and measure what already refuses the case before writing another check, because a regex beside a parser is a second, worse spelling of a rule that already held. State what the frames showed in the evidence citation on the source that claims the unit is realized; a citation that names no observation is not a review.
