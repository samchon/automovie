# Campaign Development

Read this document in full when the user authorizes implementation pull requests, or when a campaign that entered implementation reaches its end. Also read the development, pull-request and review skills before acting.

## Rules

- Put every accepted, implementation-ready issue of the cycle into one pull request. The issue DAG orders the implementation inside that pull request and never sets the pull-request count, and packages, invariants and validation lanes never split the cycle.
- Use the current checkout and one topic branch, as the [pull-request skill](../pull-request/SKILL.md#branch-from-the-target) requires, with no per-issue branch or pull request.
- Review each coherent issue result when it lands, then run one fresh integration Self-Review over the whole base-to-head diff under the [review skill](../review/SKILL.md). Earlier issue reviews do not establish integration acceptance.
- The pull request's ordinary CI and a clean integration Self-Review are the acceptance gates, and both must hold on the same immutable head; the merge-time formatting commit follows that head and needs neither a new CI run nor a new review round. Repair every red CI lane in that pull request, including a failure that predates the campaign or has nothing to do with its issues.

## Plan one cycle pull request

Recompute the published-issue dependency DAG. It decides the order in which the issues are implemented, so nothing is built on a surface a not-yet-implemented issue will reshape.

1. Reopen every published, unclaimed issue and verify it still belongs to this repository and campaign.
2. Remove only an issue proved duplicate, invalid, out of scope or externally blocked, and record the exact disposition. An accepted unresolved issue prevents completion.
3. Check open pull requests and remote branches for overlapping work.
4. Put every remaining issue into one cycle ledger with its acceptance matrix, consequence surface, affected files and DAG predecessors.
5. Order the ledger so that every issue follows its predecessors.

Keep issue-level commits. Difficulty never removes an issue. When a resolution needs a judgment call about design, invariant ownership or an acceptable behavior change, settle it from the issue's evidence and implement that decision in the cycle.

## Claim the complete cycle

Claim the whole cycle before implementing anything:

1. In the current clean checkout, switch to the target branch, run `git pull --ff-only`, and create one topic branch.
2. Create one implementation-free commit with `git commit --allow-empty`.
3. Push the branch and open one draft pull request.
4. Reference every cycle issue by number, mark verification pending, and state that the pull request owns the complete accepted cycle.
5. Record the checkout, branch, pull request, head SHA, issue set, order and external temporary-asset ledger in `.wiki`.

Put no closing keyword in the claim body. It is written before any code exists, so a claim-time `Closes #n` list closes whatever the cycle later drops, defers, narrows or disproves and hides the analysis those issues carry. The cycle's closing set is the union of the commit closing lines, which makes the merge close exactly what landed.

## Implement in dependency order

For each issue, in order:

1. Implement it across every layer its **Scope** section names, tracing the full consequence surface. A capability the authoring agent has to call is not done until it is on the sandbox engine surface, and one that exists without a surface entry, a barrel export or a guide sentence has the "capability exists and cannot be reached" defect the vertical contract prevents.
2. Meet the [development skill's coverage obligation](../development/SKILL.md#coverage-is-100-on-what-you-write) for every position you wrote.
3. Submit the coherent issue result and its consequence surface to the [review skill](../review/SKILL.md). Record any observations a correction invalidates.
4. Commit and push. End the message body with `Refs #n` while the issue is in flight, and use `Close #n: <issue title>` only in the commit that completes the acceptance, as its own paragraph before the `Co-Authored-By` trailer. Do not format during implementation, because the [pull-request skill](../pull-request/SKILL.md#merge-on-explicit-request-or-standing-autonomous-mandate) places the single formatting pass immediately before an authorized merge.

### Local validation

The [development skill's validation procedure](../development/SKILL.md#validation) owns canonical acceptance configurations, tracked consumer files and source-loader diagnosis. A local environment failure remains an observed limitation until the actual cause is verified; it neither establishes product correctness nor excuses a failed final gate.

### Honest reporting

Report what you proved and not what you built. A type existing is not a feature, a data structure is not a simulation, and a defined cache is not a lifecycle. Report an unsupported or unexecuted analysis as such. When an issue is only partially closable, say so and name the boundary, so the disposition stays visible.

## Validate with CI and the integration Self-Review

Read CI once per settled head. It gates the cycle and not each commit, so an intermediate commit's result never justifies pausing implementation, and a red result on a head the cycle has moved past is information and not the gate. CI also arbitrates anything that fails only locally, since a clean environment settles whether a failure is a defect or an artifact of one machine.

When every issue is implemented, submit the whole base-to-head diff to a fresh integration Self-Review under the [review skill](../review/SKILL.md). Include coupled results and assumptions shared between issues.

The two gates stay independent. CI proves every configured build, type-check, test, packaging and platform lane. The integration Self-Review proves requirement fidelity, consequence coverage, issue-by-issue acceptance, test quality, documentation, generated output and the risks CI does not encode.

When either gate finds a defect:

1. Diagnose the real cause from the CI log or review evidence.
2. Correct the source and complete the regression coverage.
3. Commit and push the correction without an intermediate formatting pass.
4. Let the new CI run finish and restart the integration Self-Review as a fresh complete round over the new head.

Do not merge a head whose green checks belong to an older SHA or whose clean review predates a correction. The one exception is the merge-time formatting commit, which changes layout only and is merged right after it is pushed. Submit each finding round and the final clean round as a formal GitHub pull-request review with the `COMMENT` event, with line-specific findings inline, under the [pull-request skill](../pull-request/SKILL.md#write-the-pull-request).

## Merge and clean up

Merge only with user authorization, including a campaign-local standing authorization that explicitly covers merge. Before merging, read `git log origin/master..HEAD` in full, because the squash concatenates every message, including commits a later one reverted, and confirm that each issue the merge will close has a surviving fix.

After the merge:

1. Verify GitHub records the pull request as merged into the intended target and that every linked issue has the correct final state. Reopen any issue the squash closed without a surviving fix and comment that the merge closed it mechanically.
2. Confirm the checkout holds no unpushed or uncommitted work worth preserving.
3. Switch to the target branch, run `git pull --ff-only` and delete the local topic branch.
4. For every assignment-created external path, confirm that no live process uses it, preserve required evidence, delete only the exact proven path and verify it is absent. Never bulk-delete a shared temporary directory, a global build cache, an installed toolchain or an asset whose ownership is uncertain.

The single formatting pass belongs to the final unified cycle pull request, as the pull-request skill places it, and a separate post-campaign formatting pull request is not part of this workflow.

## Repeat

Return to [Discover, adjudicate and publish](SKILL.md#discover-adjudicate-and-publish) for a complete fresh round over the entire declared scope. When any meaningful candidate survives, adjudicate and publish it if authorized, claim the next single cycle pull request with every implementation-ready issue, and repeat discovery, implementation, integration, CI, review, merge and cleanup with no fixed round limit. The campaign's [completion conditions](SKILL.md#completion) end the loop.
