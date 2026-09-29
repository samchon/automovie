---
name: evidence-graph
description: Defines automovie's committed trace from product requirements through package-independent system specifications to public TypeScript exports, plus the separate reusable generated-production contract targets under packages/template/scaffold/docs and packages/template/language-contracts. Covers their distinct @ttsc/evidence populations, citations, exclusions, README participation, stable anchors, and repository-triangle review. Use before adding, moving, or reviewing those contract sources, changing public-export evidence JSDoc, or adding or reshaping repository evidence lint configuration. For a generated production's graph, also use the evidence-graph skill that ships in the scaffold. Do not use this for frame-review evidence, design-reference evidence, or provenance records that do not use @ttsc/evidence.
---

# Evidence Graph

## Contract layers

The committed contract has three layers.

| Layer | Owns | Does not own |
| --- | --- | --- |
| `docs/requirements/` | Product promises a user can observe, request or judge | Package design, symbol names, implementation procedure |
| `docs/specifications/` | System contracts that make those promises precise | Package ownership, API reference, contributor tutorial |
| Public source JSDoc | The implementation identity and why it carries its contracts | A second requirements or specifications corpus |

Write specifications around system boundaries, state, invariants, inputs, outputs, failures and compatibility, and never by package name. One specification may be implemented by several symbols in several packages. Create no `docs/packages/` or `docs/modules/`: package usage belongs in package READMEs and exported API detail in JSDoc.

Research and `.wiki/` stay outside the committed contract population. They justify decisions, and a citation to research does not discharge a product promise.

When you write or revise the reusable production targets under `packages/template/scaffold/docs` or `packages/template/language-contracts`, read the [shared source pool](references.md) before searching anew, and verify every selected link and used passage again before citing it.

## Required triangle

Configure and validate three positive edge families:

```text
specification -> requirement
public source -> specification
public source -> requirement
```

- Every controlled requirement section receives positive specification evidence.
- Every controlled specification section cites the requirements it makes precise, and only the narrow README exclusions below are permitted.
- Every selected public source symbol cites at least one requirement and at least one specification that it materially implements.
- Select the complete public export surface and enable `evidence/documented` for it, so every exported symbol has a JSDoc carrier. Never narrow files or symbol kinds to avoid obligations.

For each direct source-to-requirement edge, at least one specification the source cites must reach the same requirement through configured positive specification edges. A source citing unrelated documents is not consistent merely because both citations resolve.

In Self-Review, trace this path from resolved unit identities and configured positive edges, then read the source, specification and requirement to confirm they express the same implemented behavior. Matching words, folder names and package ownership prove nothing.

Do not set `uniqueEvidence` on a specification reference to manufacture an owner, or `singleEvidencePerSymbol` where a symbol or section can answer for several units. Shared implementation is valid, and the obligation is at least one citation and never exactly one.

## Validation responsibilities

| Owner | Responsibility |
| --- | --- |
| Native `@ttsc/evidence` | Evaluate the graph relationships, documentation carriers and declared unrealized work configured through `evidence/graph`, `evidence/documented` and `evidence/todo` in each active lint project. Its published configuration and diagnostics are the dependency contract. |
| AutoMovie product validation | Enforce the generated production's declaration, physical population boundaries, contract inventory, stages and topology through [`@automovie/evidence`](../../../packages/evidence/src/createAutoMovieEvidenceConfig.ts). These are production input invariants, separate from this repository's graph. |
| Semantic Self-Review | Read the actual carrier, target, reason, exclusions and downstream behavior, and confirm complete carrier selection, README participation, stable identities, both citation families and the triangle against what the implementation does. |

Keep source-text snapshots, repository-shape validators and unpaid-host exception lists out of this workflow, and add no second validator to retest the native dependency. A passing check records that check's result. It does not establish that every product promise is implemented or every citation is truthful.

## Carrier population

Derive the complete carrier population from a source-tree glob and never from a hand-written union of paths. A listed population makes "owes no evidence" the default for every file added later, and nothing reports the omission.

- Write each whole-population exclusion as a negative pattern beside the positive one, and state in the population's JSDoc why that file owes no package contract. Three reasons are accepted: a barrel re-exports declarations that already answer at their definition, a process entry point is not a contract carrier, and a generated file is not authored.
- Cross every directory depth (`src/**/*.ts`), because a one-level glob admits only the top directory.
- Derive a domain-partitioned population by subtraction. A specialized claim names the stable files of its domain, and one residual claim starts from the complete glob and subtracts those assignments, so a new source answers for the residual domain until someone assigns it elsewhere. `@ttsc/evidence` evaluates patterns left to right and a later positive pattern re-admits what an earlier negative removed, so add a file back after the spread.
- Selection alone establishes nothing about what a carrier implements. Self-Review inspects every changed public carrier against its actual contract under the triangle above, and any unpaid relationship it records names the exact reviewed population and revision.

## Package participation

`@automovie/production` and `@automovie/playground` carry the same `evidence/graph`, `evidence/documented` and `evidence/todo` obligations as the other public packages. Production owns the builder, project store, capture, inspection and render-job contracts it implements, and playground owns the durable prototype-view surface it exports. A smaller application surface never excuses a public export from requirement and specification traceability.

A package that the [project skill](../project/SKILL.md#layout) lists as answering the [contracts skill](../contracts/SKILL.md) is outside this triangle.

## Split independently payable units

`evidence/graph` proves that a unit has a claimant. It does not prove that several partial claimants add up to the complete unit. When behaviors can mature, fail or be implemented independently, give each its own H3 with a stable anchor and let the native triangle validate it directly.

Create no second fragment grammar, carrier tag or ownership ledger. Such records duplicate the Markdown unit and source citation identities and drift when either changes. If several packages implement one inseparable unit, every positive citation must implement the complete unit, and if none does, the unit is too broad and must be split before it is cited.

Leave a unit nobody implements without a positive carrier and do not exclude it. An exclusion states that the claim intentionally owes nothing, and spending one on unfinished work confuses a decided boundary with an unexamined gap.

## Stable identities

Give every controlled H2 and H3 an explicit, unique, lowercase ASCII anchor, and keep it stable through prose revision and translation so citations survive wording changes.

Select Markdown by contract role and never by filename exception. README files participate like every other matching Markdown file, and removing `README.md` from a glob because some sections are explanatory is forbidden. When one README section owes nothing to a claim, let an eligible claim host carry the narrowest `@evidenceExclude` for that target.

## Author citations

Place a Markdown citation in an HTML comment under the heading or at the file position that owns the claim, and a TypeScript citation in the JSDoc of the selected public export or member.

```md
## Deterministic playback {#deterministic-playback}

<!-- @evidence requirements/playback/reproducibility.md#same-input-same-frame Defines the system invariant that realizes this promise. -->
```

```ts
/**
 * Samples one declared timeline without hidden clock state.
 *
 * @evidence requirements/playback/reproducibility.md#same-input-same-frame Produces the promised repeatable frame state.
 * @evidence specifications/time/timeline-sampling.md#fixed-clock Implements the fixed-clock sampling contract.
 */
export function sampleTimeline(): void;
```

Resolve targets from the active claim's `root`, files and symbol selectors. A path copied from another project or claim is not evidence that it resolves here.

Make every reason state why this claimant answers for that target. A restated heading, an ownership assertion or a sentence written to silence a diagnostic is not a reason. Test it by exchange: read this claimant's sentence against a sibling that answers the same target, and the sibling's against this one. If neither becomes false, neither was written about the export it sits on. Counting members or lines describes size and not what the target required, and a statement about how something is written (an identifier, a number, a path) must use the export's own rendering.

Use `@evidenceExclude` only when the claim intentionally owes nothing to the target, and state the boundary and why no implementation belongs there. An exclusion is not positive evidence and does not satisfy a reference configured with `noEvidenceExclude`.

Repository and generated-production graphs never require `@evidenceReview`, `@evidenceExcludeReview` or companion fingerprints. Keep `evidence/review` disabled on the repository graph, because its complete population carries enough relationships that one companion sentence per edge becomes repeated acknowledgement and not inspection.

The generated-production graph is separate. Its completion stage is `evidence`, and it requires truthful relationships over its authored population plus the author's actual-output judgment under the shipped evidence-graph and review-verification skills. The shipped skills own the scaffold's target families and checklists, and this repository's triangle is imposed on no production.

## Change workflow

1. Read the documentation skill and update `.wiki/` as the decision develops. Read the project skill for scope, the development skill for source or test changes, the scaffold skill when the shared contract inventory changes, and the scaffold's shipped evidence-graph skill when a production's own graph is involved.
2. Inspect the current typed `lint.config.ts` files, workspace scripts and CI workflows, the applicable product validators and their logic tests, the active `@ttsc/evidence` documentation and declarations, and every affected citation. An archived branch or earlier decision is not the active implementation.
3. Classify each statement as requirement, specification, package usage, public API contract, research or working knowledge before choosing its home.
4. Describe each claim-reference pair as one sentence before configuring it. If the sentence does not match the selected files and symbol kinds, correct the population.
5. Add or revise the contract text, stable anchors and positive citations together, keeping direct requirement and specification citations on every affected public source symbol.
6. Inspect every affected source triangle, including selected README units and anchors, and correct the document, citation or claim population wherever it disagrees with the intended contract.
7. Run [Verify](#verify), then Self-Review the whole declared evidence surface under the review skill.

## Interpret failures

- A missing acknowledgement is an unpaid relationship. Build the missing artifact, or add a truthful citation from the artifact that already answers for it. Add no exclusion or unrelated citation to make the build green.
- A dangling target is contract drift. Find whether the document, anchor, root, glob or symbol identity moved, then update every real dependent or restore the stable identity.
- An uncovered requirement during requirements-first work is visible implementation debt. A deliberately red graph is more accurate than a false citation, so record the phase and debt in `.wiki/` and the pull request and leave the permanent rule alone.

## Verify

Run the configured `ttsc --noEmit` or package build for every affected claim project. When the repository docs workspace exists, run its declared lint script, and when package source citations change, run the owning package build.

For a graph-configuration change, inspect the actual roots, globs, exclusions, symbol selectors and relationship options beside the selected contracts and exports, and confirm the claim includes the intended README roles and every affected carrier. Record the observation's revision, selected population and native diagnostic apart from the semantic review result.

When reviewing a generated graph adapter, compare its emitted native configuration and authored declaration under the [native input projection contract](../../../docs/specifications/production-evidence/native-input.md#spec-authoring-production-evidence-native-boundary), and judge the boundary by the installed native types and evaluator behavior.

When execution is authorized, arm the changed carrier selector as the [development skill](../development/SKILL.md#work-rules) requires of every configured check:

1. Add one disposable carrier the selector is meant to admit and give it a dangling citation.
2. Confirm that the diagnostic names that carrier.
3. Exclude only that carrier from the selector and confirm the diagnostic disappears.
4. Restore the selector and remove the carrier before rerunning the normal check.

This observation checks the changed wiring. It does not become a permanent source-text assertion or a dependency correctness suite.

When a configured check or population observation cannot run, record the exact command, the reason and the remaining verification boundary in the pull request. Report only unpaid relationships observed at the stated revision, because an unexecuted check is neither a verified graph nor evidence of zero debt.
