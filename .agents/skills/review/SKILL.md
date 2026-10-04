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

An intermediate review declares the coherent result being submitted and its consequence surface. Final integration covers the complete base-to-head change and coupled consumers. A correction restarts the declared review surface and repeats the observations it invalidates; it does not turn an intermediate review into a repository-wide audit. Identify affected shared boundaries, derivatives and consumers when choosing the surface.

A change invalidates every check, render, measurement and evidence answer whose inputs it touched: a source, shared-boundary or basis change invalidates them for the affected consumers and derivatives, and an instruction or documentation change invalidates the review of that text and its callers. A mechanical check, render or measurement whose inputs are unchanged keeps its validity at its recorded revision, so a later stage cites that result instead of rerunning it unless its owning gate requires a result at the exact head, as pull-request CI does, while a review reading is never cited and every round still reads its whole declared surface afresh; the final integration review still covers the complete change and reopens anything a later edit touched.

Write each finding at the narrowest reproducible location: changed line, public symbol, test case, diagnostic, target identity, frame, interval, subject or render view. Separate what was observed, what the contract requires, the consequence, and any cause proved from control flow or history; an unproved cause stays a hypothesis. Classify a verified finding by affected contract or behavior, impact, reproduction conditions and repair priority (impact and priority are different facts). Several manifestations may share one root cause, and each reproducing location remains evidence until the whole class is repaired.

Compare alternatives only when their source, intent, platform, inputs, time position and presentation conditions make the comparison meaningful. Name the common basis and the actual difference, and report the comparison limit when the basis does not match.

Preserve history through commits and formal pull-request reviews. A later correction supersedes an earlier finding without rewriting it. A Self-Review `COMMENT` is a process record, never an approval, rejection, conditional approval or waiver on anyone's behalf.

## Self-Review

Self-Review and an unqualified review request use this workflow:

1. Declare the review boundary. An intermediate coherent-result review includes that result's complete changes and consequence surface. Final integration and an unqualified Self-Review include the entire pull-request base-to-head diff and all uncommitted changes.
2. Perform one complete round under the Non-Negotiable Review Law over that surface. Apply the [evidence graph skill](../evidence-graph/SKILL.md) for a changed requirement, specification, public citation or graph configuration, the [contracts skill](../contracts/SKILL.md) for a declaration enrolled in a contracts claim, and the [viewer-verification skill](../viewer-verification/SKILL.md) for visual behavior. A checker establishes that an answer exists; this review judges its truth and actual consequence.
3. Reproduce every suspected defect before accepting it.
4. Apply every sound improvement and run the narrowest verification the owning workflow authorizes.
5. If anything changed, restart at step 1 as a fresh full round.
6. Finish only when a complete round finds nothing to improve. A surface that changes agent instructions finishes under the documentation skill's stricter [review gate](../documentation/instructions.md#review-gate) instead. Report the final clean round or rounds and every verification that could not run.

Self-Review does not authorize creating, pushing, updating or merging a pull request; the pull-request skill owns those.

## "It is missing" is a claim that needs its own evidence

A failed name search does not establish a missing capability or an unintended omission. Before accepting that claim, inspect the owning contract and type JSDoc, related fields and any declared exclusion or reopening condition; the checked-in implementation and reachable consumer, through the actual exported identity rather than only a filename or generated artifact; and the relevant guide and closed decision. When generated-production authoring reachability is in question, follow the [scaffold skill](../scaffold/SKILL.md#authoring-procedures-live-with-the-production) to the applicable shipped route and search in the author's vocabulary.

When this inspection turns up a declared position, the finding becomes "this was deferred, and here is what now lets it be done deliberately within stated bounds", which carries a different burden of proof.

"It is already there" needs the same discipline, because a symbol's existence is not a path's existence. Before writing that a capability exists, confirm that the contract gives an author somewhere to declare it, that the builder or runtime calls it, that the author can reach the symbol, and that the result shows up in a frame or in evidence.

## Let the builder decide what it can

Choose evidence for the claim. A numerical check, source trace and rendered observation answer different questions, and each result is tied to the source and input it inspected.

- Binding, exports, determinism, engine enforcement and error paths are settled by reading the module.
- Identity, references, scope, ownership, ranges and downstream consumability are settled by the records and compile diagnostics.
- A mechanically specified acceptance predicate requires its actual validator result. Citation counts and passing compilation do not establish anatomical validity or clinical qualification.
- Whether a silhouette reads, a performance is credible or a cut lands is settled by frames alone.

For generated-production predicates and actual-output evidence, follow the shipped [production review procedure](../../../packages/template/scaffold/.agents/skills/review-verification/review.md). When a finding repeats, inspect the existing refusal before adding a diagnostic at the actual owner. Do not add a source-text approximation beside the parser or validator that already owns that rule.
