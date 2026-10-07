# Production evidence staging

Read the complete typed production declaration and graph in `lint.config.ts`, every target and host involved, and the applicable authoring phase document before changing a stage or evidence statement. `@automovie/evidence` owns reusable graph mechanics; the generated project has no second production-evidence declaration.

## States

Every layer is `disabled`, `draft`, `evidence`, or `review`.

- `disabled` means the layer currently has no governed hosts and its shared claims do not run. The selected kind decides whether the layer is forbidden or merely not begun.
- `draft` means the layer is applicable and owns non-empty hosts, but shared evidence coverage is off while the author completes the first version.
- `evidence` enables the layer's shared and production-specific claims and is its completion stage. Complete coverage and literal semantic inspection belong here; no companion review annotation or fingerprint is required.
- `review` is a compatible completion declaration for existing projects. It uses the same companion-free structural policy under [Rendered realization review](#rendered-realization-review).

An applicable layer moves `disabled -> draft -> evidence` and remains at `evidence` after completion. Existing `review` declarations also count as completed stages; adopting `evidence` for such a layer changes its compatible declaration, not its completion level. Later target or source edits require fresh inspection of every affected relationship and actual output. Do not return incomplete authored hosts to `disabled`, and do not leave a host behind when its layer is disabled.

The one backward-stage exception is a passed vertical-slice pilot. Follow [Return to the complete production](../production-lifecycle/pilot.md#return-to-the-complete-production) for its exact predecessor checkpoint, recoverable archive, and subsequent complete-production rebuild. No other mode, partial branch, unrepaired pilot, or later ordinary revision may move a stage backwards.

`draft` contains no evidence tags in authored settings, research, design, narrative, brief, or source hosts. Preserve their citation intent in ordinary prose or working notes, then author their complete evidence batch only after the layer passes its first-version audits and moves to `evidence`. This keeps partial production annotations from looking like partial completion.

Only the exact retained hosts in that verified reset checkpoint may carry inactive predecessor tags in `draft`. The pilot procedure owns their preservation and retirement; the ordinary draft prohibition applies again when complete-production rebuilding begins. Changing the mode to evade an ordinary draft diagnostic is a harness violation.

`docs/contracts` is a different host kind governed by [Production-specific contract](work-specific.md). A layer's discovery claim becomes active in `draft`, so stage enforcement permits that separate contract population to carry its discovery annotations before authored hosts may carry evidence tags. Do not apply the authored-host draft prohibition to the contract population.

The authored-unit topology is closed. Every treatment event file and script, construction-screenplay, or final-screenplay unit file begins with its required H1 title; every delivery index contains only its required H1 and generated unit links. Other authored hosts may optionally begin with an H1 title. Outside that title, settings, research, map, model, space, material, instance, motion, system, and treatment hosts use only anchored H2 units; script, screenplay, and brief hosts use only anchored H2/H3/H4 units. Any other heading depth fails instead of hiding an ungoverned decision. Final screenplays mirror construction filenames, titles, identities, nesting, and order exactly.

## Relationship types

The live binding inventory identifies the exact discovery, principle, and obligation targets selected for each authored role under [Contract targets](contract-targets.md).

- A principle is an item-by-item unit checklist. Every selected authored H2, H3, and H4 answers every applicable principle directly, exclusions are refused, and one strong unit cannot cover a weak sibling or descendant.
- An obligation is ordinary no-exclusion coverage across the selected layer. Relevant authored H2 owners fulfill its targets; a population-wide conclusion may use the family's declared aggregate account under `docs/accounts/<layer>`. Each layer selects its own applicable families. Several owners contribute where the substantive duty requires them.
- Discovery is ordinary coverage by the flat `docs/contracts/*.md` population, never a checklist or testimony carried by authored H2/H3/H4 units. The graph creates one claim for each active settings, research, map, model, space, material, instance, motion, system, treatment, script, screenplay, or brief population and gives it that population's shared discovery references: common plus settings for settings; common only for research; common plus designs plus the own layer for each design branch; common plus films plus the own layer for treatments, scripts, and screenplays; and common plus briefs for a brief. Disabled and shape-forbidden populations keep their discovery claims disabled, and source populations do not become discovery hosts. [Production-specific contract](work-specific.md) owns the result classification and adopted-rule boundary.
- Settings, map, model, space, material, instance, motion, and system references are foundation coverage. A host cites only the units it uses. A target no host in that claim population uses may receive one concrete population-wide exclusion only where the configured reference permits it. Research has one stricter bridge: every completed research H2 is interpreted by a settings H2, and later layers cite that settings owner.
- Film relationships split by axis. Every script and screenplay unit file cites in its pre-H1 comment every treatment H2 realized anywhere in that file, and every H2/H3/H4 cites every treatment H2 it actually realizes. The file-host union and the host union at each governed heading depth each cover the complete treatment H2 population without exclusion. Every screenplay file additionally cites exactly one script file, every screenplay H2/H3/H4 cites exactly one same-depth script parent, every script parent has one screenplay child, and only that script-to-screenplay delivery lineage has exact physical order and nesting.
- Final screenplay relationships form a separate revision axis. Every final file cites exactly one construction screenplay file, every final H2/H3/H4 cites exactly one same-depth construction unit, and every construction counterpart has one final owner. Final units answer only selected naturalness checklists and production-local claims declared with `pass: "naturalness"`; construction principles, obligations, discovery, and upstream answers remain in construction.
- Design-source ownership is exact per selected export: model branches require a concrete exported class and select every exported type; motion branches select every exported function and property; map, space, material, instance, and system branches select every exported type, function, and property. Each selected export cites exactly one design file. More than one export may implement the same design; source-obligation and design-unit coverage is distributed across the complete branch population. Each shot or acceptance export likewise cites one screenplay scene or brief shot, and the complete source population covers every such parent.

An omission from one host is not an exclusion. `@evidenceExclude` says no host in the complete claim population owes the target. Never cite and exclude the same target in one population, use one host as a catalogue for all targets, or use a generic reason to hide missing authored work.

## Rendered realization review

The generated standalone graph configuration stays at error severity. At `evidence`, source realization keeps error references for coverage, positive acknowledgement, and configured cardinality without companion review freshness. The author inspects the actual output under [Production review](../review-verification/review.md); a complete graph alone does not establish a visual result.

Every source relationship, authored principle, discovery, foundation, lineage, upstream duty and population account uses its complete structural reference with `requireReview: false`, including compatible `review` declarations. No additional companion-review warning reference is emitted. Missing or wrongly owned citations still block. Roots, files, symbols, exclusions and cardinality retain their existing obligations. The manifest exposes the emitted policy; source-owner readers retain one exact executable lineage identity.

`obligations/design/models.md#model-review-set` defines the finite review plan. Write its views, neutral background, scale, and comparison criteria before rendering. Its obligation reference remains an error, as do model construction, determinism, and fidelity boundaries.

In every completed stage, open all required current output, compare it with the authored target and finite plan, and repair the source and evidence at their true owners. Source edits require renewed observation because physical identities bind source, compile generation, and the applicable observation plan. The builder's `review` and `final` physical evidence gates remain errors. Film and brief owe the models their compiled staging consumes; a library owes the exact active graph-derived design owners and their applicable finite observations. Compilation success, a complete graph, a render call, and a stored sentence do not replace those observations.

## Tags

Place each selected principle answer directly below its authored H2, H3, or H4. Place applicable foundation, lineage, and local claim answers with their actual owner. Technical design foundation answers belong with their consuming H2 units. An obligation answer belongs with the H2 that fulfills it or with an aggregate account that owns the population conclusion. Narrative and brief file parentage answers belong before the first H1 when a configured file claim selects that relationship.

Put a contract file's discovery answer in one HTML comment before its first H1, because discovery selects the contract as a file host. Keep those annotations outside the target H2s the same file defines. Put every discovery exclusion in that position in `docs/contracts/index.md` and nowhere else; the index has no target H2 or positive answer. A contract in a nested directory is refused because `contracts/*.md` cannot select it.

```text
@evidence path/file.md#anchor What exact fact, decision, transition, or observation the host realizes.
@evidenceExclude path/file.md#anchor Why no host in the complete population owes the target.
```

No stage or additive claim requires `@evidenceReview`, `@evidenceExcludeReview` or a companion fingerprint. A compatible `review` declaration uses the same structural policy as `evidence`. Preserve valid acknowledgements and exclusions and record actual observations with their owners. Existing historical review prose supplies no completion or freshness gate.

Use configured evidence roots such as `settings/...`, `models/...`, `motions/...`, `treatments/...`, `scripts/...`, `screenplays/...`, `final/screenplays/...`, shared `discovery/...`, `naturalness/...`, `principles/...`, and `obligations/...`, or the root declared by a production-specific claim. These `scripts/...` evidence references resolve under `docs/scripts`; `src` contains executable tooling and is not the authored screenplay evidence root. Do not prefix a target with `docs/` unless that claim's root requires it. Every Markdown target unit has a stable explicit anchor.

When a physical-input boundary changes, create a disposable generated consumer and replace one governed population input with a hardlink. Verify that both lint and the evidence reader refuse that aliased identity, because a walk reaching one inode through two names would carry two independent owners of the same bytes. The project's `package.json` is admitted by a separate decision and is read once at a fixed path, so verify it differently: replacing it with a symlink is refused, while a second directory entry naming the same manifest is still read. Remove only the exact link after confirming the disposable root and target.

Write host-specific reasons under [Literal semantic pass](../review-verification/semantic-review.md#literal-semantic-pass), including its exchange and exact-rendering checks. Counts and target-name paraphrases alone establish no relationship.

## Transitions

Move a layer from `disabled` to `draft` only after its initially applicable discovery targets have a complete result under [Production-specific contract](work-specific.md) and the matching discovery host relationship. Add the layer's non-empty authored hosts as the transition begins. A layer forbidden by the selected shape remains disabled with neither authored hosts nor a running discovery claim.

Move a layer from `draft` to `evidence` after the full layer has a complete first version, stable anchored topology and ordered files, a scope and omission audit, and applicable discovery results under [Production-specific contract](work-specific.md). Read each selected principle against its governed units and confirm that relevant H2 owners collectively fulfill every selected obligation. Commit that coherent draft before changing the state.

Complete the layer at `evidence` after all shared and production-specific claim batches are complete and scoped source lint and `npm run evidence` have no errors. Close the coherent transition through [Author process Self-Review](../review-verification/self-review.md), which routes semantic inspection and applicable actual-output review. A stage declaration does not record that inspection.

A child may enter `draft` only after every direct parent's declaration is completed at `evidence` or compatible `review` and its error-level relationships are paid. Research, when present, is an additional completed parent of construction documents. Screenplay naturalness waits for completed construction; film shots wait for completed naturalness and brief shots for completed briefs. Shots also wait for the matching source declaration of every active design branch. Production source waits for settings; film source waits for production source and shots. Admission to source compile does not replace the actual observations required by the physical review and final gates.

A design layer may enter `evidence` only after every active design foundation is completed at `evidence` or compatible `review`. Spaces are founded on maps, models on spaces, materials on models and spaces, instances on maps, models, spaces and materials, and motions and systems on each other and on all four. A foundation contributes its units only after completion; a disabled foundation contributes no units and is not demanded.

This foundation gate applies when entering `evidence`, while draft authoring may proceed against another draft foundation. Motions and systems form a cycle: write both through `draft`, then promote both to `evidence` in one declaration so each sees the other's completed units.

`@automovie/evidence` checks non-empty host populations, required anchors, named source owners, population accounts, production-kind exclusions, the declared settings-and-design provider-consumer topology, flat treatment topology, treatment coverage, exact script-to-screenplay delivery identities, and exact construction-to-final screenplay identities from the declaration before standalone evaluation. Read `readAutoMovieProductionEvidence(...).manifest.topology` as the provider-consumer-status-reason matrix; every diagnostic is an account or lifecycle defect, while an `inapplicable` row is green only when its provider or consumer is genuinely outside the selected population. Keep every project-specific selector and additive claim in the one typed `lint.config.ts` declaration that also turns that value into the standalone graph configuration. Preserve the typed declaration, additive `claims`, layer grouping, host-independent ordering, and mixed-state tests.

## Diagnostics

A diagnostic is routed through the [conformance owner map](conformance.md) before repair. The builder owns mechanically decidable syntax, graph, attachment, and freshness failures. [Semantic evidence inspection](../review-verification/semantic-review.md) owns the author's truth, role, literal support, absence, and exchange judgments.

A builder diagnostic is a question about the artifact, not an instruction to add a tag.

An error follows the halt-and-repair sequence below. [Rendered realization review](#rendered-realization-review) owns the actual-output obligations and independent physical gates after structural admission.

1. Stop the current evidence batch and any downstream work behind its gate.
2. Read the full diagnostic, complete host, complete target with selected descendants, config, and necessary upstream and downstream context.
3. State the intended semantic relationship without relying on the existing annotation.
4. Compare plausible defects in target, host, ownership, hierarchy, statement or placement, claim population or cardinality, and builder behavior.
5. Fix the earliest actual owner and every affected dependant.
6. Reread the repaired scopes literally before writing evidence or resuming the batch.

Rewrite false or shallow content. Split, move, rename, merge, or replace a target whose scope is wrong. Correct only the tag when the content relationship already holds. Change config only when its intended population, stage, cardinality, exclusion, or implementation is itself wrong.

Never clear a diagnostic with exaggerated evidence, copied reviews, blanket exclusions, filler, path shuffling, stage reduction, weakened populations, invented fingerprints, or a package exception. Perform the owner map's halt and earliest-owner repair before retaining any acknowledgement.

## Production-specific claims

Classify and place a work rule through [Production-specific contract](work-specific.md) before configuring it. Use [Contract targets](contract-targets.md) for the shared inventory and target forms rather than recreating either in stage instructions.

A production-local principle uses selected authored-unit hosts, H2 targets, `checklist: true`, no exclusion, and the host pass's activation stage and structural relationship policy. Construction is the default. An expression-only final screenplay rule sets `pass: "naturalness"`, uses `final/screenplays/...` hosts, and keys its stage to `naturalness.screenplays`. A production-local obligation uses ordinary coverage from a construction layer's authored H2s and declared aggregate account to its contract H2s; obligations are never naturalness claims. An independent target declares the population and relationship its distinct evidence behavior requires. The typed claim owns those mechanics.

Use the installed `@automovie/evidence` README and `createAutoMovieProductionObligationClaim` JSDoc for helper inputs, defaults, eligible-owner selection, and manifest fields. Local obligations are construction-only; a local naturalness principle explicitly selects final screenplay hosts and their naturalness stage. Preserve canonical activation, error severity, complete population, and reference policy. `inapplicable: true` is an explicit first-pilot audit, not an ordinary missing-work exception.

Keep helper-returned claims in the tracked `productionEvidence.claims` declaration and pass the whole declaration through `createAutoMovieEvidenceConfig` and `createAutoMovieStandaloneEvidenceConfig` for the standalone CLI. The factory validates ownership before projecting native claims. Do not strip `autoMovieBinding` from the authored declaration or pass the helper's metadata-bearing claim directly to the native evaluator; those are different inputs for different readers.

If the native schema rejects internal metadata, repair the package boundary and refresh the installed harness before continuing, preserving the declared ownership and reference policy.

During migration, reread each obligation at its relevant authored or aggregate owner. Preserve production facts and valid principle and parent relationships. Remove annotations for retired targets and superseded account-to-population edges, then review changed relationships from their actual content. Follow [Activation and revision](work-specific.md#activation-and-revision) for the instruction handoff.

## Verification

Run the scoped generated-project source lint at every transition and final package gate, not at prose checkpoints. After changing a claim, a target, or a stage, delete the citation the change was meant to require and confirm the builder refuses before restoring it. For discovery, separately prove that a retained result with no contract host fails, an exclusion outside `contracts/index.md` fails, and a nested contract is refused instead of ignored. A configured claim that selected no host reports the same green as a satisfied one. A pure deletion that changes no stage, claim, config, source, or schema needs exact target and diff inspection rather than an unrelated build.
