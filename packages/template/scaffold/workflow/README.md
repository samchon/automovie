# Production workflow provenance

This production-owned workflow adapts the evidence graph and independent-review lifecycle from [`wrtnlabs/wrtn-novels`, `packages/config/src`](https://github.com/wrtnlabs/wrtn-novels/tree/a26ab06ebf31ee5b2aa85979fce1881b2898be7e/packages/config/src) and the required narrative structure checks from its [`packages/cli/src/internal`](https://github.com/wrtnlabs/wrtn-novels/tree/a26ab06ebf31ee5b2aa85979fce1881b2898be7e/packages/cli/src/internal) at commit `a26ab06ebf31ee5b2aa85979fce1881b2898be7e`. The production skills and story contracts also adapt its [`packages/template/scaffold/.agents/skills`](https://github.com/wrtnlabs/wrtn-novels/tree/a26ab06ebf31ee5b2aa85979fce1881b2898be7e/packages/template/scaffold/.agents/skills) workflow. The original MIT copyright and permission notice are retained in [LICENSE](LICENSE).

The adaptation replaces the novel's prose layer with an audiovisual screenplay, uses parts for release partitions, and adds direct screenplay and standalone asset routes. Engineering claims remain global duties. Detached construction evidence, frozen construction, naturalness working copies, current review fingerprints, population obligations, exact factory ownership, full-analysis validation, metadata rewrite protection, and selected-versus-complete scope retain their original roles.

The files belong to this production and can be changed with its requirements. The default root `evidence.config.ts` selects engineering checks only. After narrative opt-in it exports the narrative factory graph; `check.ts` reads that same config instance and reports structural readiness. Readiness does not issue an independent creative verdict or prove that a rendered film realizes its script.

## Architecture responsibilities

The upstream paths below refer to the fixed source revision above. Related questions may share one checklist question here; their respondents and pass responsibilities remain distinct.

| Upstream owner | Production owner |
| --- | --- |
| `novel-workflow` | [Production](../.agents/skills/production/SKILL.md) and [narrative lifecycle](../docs/guides/narrative-lifecycle.md) |
| `novel-instructions` and delegated direction | [Instructions](../.agents/skills/instructions/SKILL.md) and [direction](../.agents/skills/instructions/direction.md) |
| `evidence-discovery` | [Discovery](../.agents/skills/discovery/SKILL.md) |
| `novel-settings`, `novel-treatments`, `novel-scripts` | [Settings](../.agents/skills/settings/SKILL.md), [treatments](../.agents/skills/treatments/SKILL.md), [scripts](../.agents/skills/scripts/SKILL.md) |
| `novel-prose` and its independent drafting context | [Final audiovisual screenplay](../.agents/skills/screenplay/SKILL.md) |
| `novel-naturalness` procedures and edition comparisons | [Rewriting](../.agents/skills/rewriting/SKILL.md) and [revision cycles](../.agents/skills/rewriting/cycles.md) |
| `contract/shared` principles, obligations, discovery, upstream, naturalness, review | [Story contract families](../.agents/skills/contracts/story/index.md) |
| Language discovery, value wording, naturalness, relationship speech, and population comparisons | [Shared discovery](../.agents/skills/contracts/story/shared/discovery/common.md), [language and value ownership](../.agents/skills/contracts/story/shared/obligations/common.md), and [expression questions](../.agents/skills/contracts/story/shared/naturalness/common.md) for the actual language |
| `evidence-writing` | [Creative evidence](../.agents/skills/evidence-writing/SKILL.md) |
| `evidence-graph-config` and `packages/config` | [Contract configuration](../.agents/skills/contracts/SKILL.md), this workflow, and its local public declarations |
| CLI narrative topology, partition lineage, and revision identity checks | The actual [pass checker](check.ts), alongside native Evidence relationships |
| `novel-review` reading, source audit, finding exchange, and whole work | [Independent review](../docs/guides/narrative-review.md) and [completion lifecycle](../docs/guides/narrative-lifecycle.md) |
| `estimation` | [Read-only experience estimation](../.agents/skills/estimation/SKILL.md) |

Video replaces final prose with image, sound, performance, and editing decisions, and replaces novel length recommendations with the production's duration and delivery promises. Korean-only language selection becomes responsibility for the actual chosen language; speculative signal bans remain outside active contracts. The upstream reader-book exporter and central baseline migration commands belong to its distribution system. This scaffold instead retains the production's one-way file ownership and actual source/package commands; neither distribution choice removes a creative pass or its checks. Short direct entry and asset-only work follow their explicitly selected production routes.

## Configure the production

The generated [lint.config.ts](../lint.config.ts) checks ordinary TypeScript correctness. The default [evidence.config.ts](../evidence.config.ts) selects only [engineering claims](engineeringClaims.ts); coding and standalone assets need no story mode, stages, or narrative gate. Add asset and delivery duties to their actual respondents when the production needs them.

For a long film or series, select the shipped [narrative.config.ts](../narrative.config.ts) by replacing the root config export with:

```ts
export { default } from "./narrative.config";
```

Then edit that optional profile for the requested route and contracts. It adds the narrative factory and retains the same engineering claims as `supportClaims`. Its initial stages allow complete drafts before evidence activation:

```ts
const construction: IProductionConstruction = {
  index: "disabled",
  settings: "disabled",
  treatments: "disabled",
  scripts: "disabled",
  screenplay: "disabled",
};
const naturalness: IProductionLayerStages = {
  scripts: "disabled",
  screenplay: "disabled",
};
```

These declarations are taken from that optional profile. `mode: "long"` retains settings → treatments → scripts → screenplay. For `mode: "short"`, keep settings, treatments, scripts, the outline, and scripts naturalness disabled; author screenplay directly. Standalone asset work normally retains the default root config; the factory also supports `mode: "asset"` for an existing profile whose narrative stages all remain disabled. Enable a selected pass with `"evidence"` after its complete body is ready for its evidence duties. A stage never issues an independent creative verdict.

`narrativeScope: { mode: "complete-work" }` selects the complete authored population. A requested pilot uses `{ mode: "first-part-pilot", part: "001-slug" }`: scripts and screenplay select that exact first part; treatments contains only its selected events. Restore complete-work scope and its full populations before claiming whole-work completion.

## Put each respondent with its owner

The built-in selectors use numbered Markdown files. A one-scene short can use `docs/body/screenplay/001-part/001-scene.md`; it does not need settings or treatments.

| Location | Respondent or input |
| --- | --- |
| `docs/instructions/*.md` | Adopted user requirements |
| `docs/body/settings/001-topic.md` or `docs/body/settings/NNN-subject/001-topic.md` | Shared canon; do not mix flat and classified layouts |
| `docs/body/settings/outline/index.md` | Outline whose H2 groups and H3 entries cover the canon |
| `docs/body/treatments/001-event.md` | Event sequence, independent of release partitions |
| `docs/body/{scripts,screenplay}/001-part/001-scene.md` | Scene design or final audiovisual screenplay |
| `docs/evidence/construction/{files,units}/<layer>/<relative-file>.md` | Detached answers for the corresponding file or H2 |
| `docs/revision/{scripts,screenplay}/<relative-file>.md` | Frozen construction for the current expression revision |
| `docs/naturalness/{scripts,screenplay}/<relative-file>.md` | Working text and its revision evidence |
| `docs/review/{draft,final}/<layer>/round-N/<relative-file>.md` | Current unit reviews; the highest numbered round is selected |
| `docs/review/{draft,final}/<layer>/round-N/verdict/index.md` | Whole selected population verdict |

Detached answer documents identify the exact selected body respondent. Reviews mirror its H2 units; construction reviews target body and naturalness reviews target working text. Use the installed `@wrtnlabs/evidence` README and public types for annotation syntax, exact target discovery, and fingerprint APIs.

Additional story duties live under `.agents/skills/contracts/story/{language,work}`. Build their claims with the local [checklist](createPackageChecklistClaim.ts) or [population](createPackagePopulationContract.ts) helper as appropriate. Every entry in `claims` needs one unique name and one matching `gate.claimScopes` record containing that exact name, its owning layer, and `pass: "construction"` or `"naturalness"`. The owner must be active in the chosen route. A work claim extends the shared graph and uses the same stage; it does not replace the built-in duties or own another layer's body.

`supportClaims` keeps engineering checks global. Its selectors must stay outside the authored body, revision, naturalness, evidence, review, user-instruction, and story-contract trees, including physical and logical aliases. Evaluation captures regular-file identity across those protected trees, including inactive layers, disabled descendants, and files outside a selected pilot, so an external hard link cannot release that ownership. Duties consuming those inputs belong to exactly scoped work claims. When changing the layout, update the local selectors, detached respondents, review mirrors, and source relationships together.

## Run a complete pass check

After writing the selected body and its evidence, run the actual project command for the pass being submitted:

```sh
npm run production:check -- --layer screenplay --pass construction
npm run production:check -- --layer screenplay --pass naturalness
```

The command preserves the complete package report. `rereadReady` says the selected pass and its prerequisites are ready for a complete independent reading. `approvalStructureReady` additionally requires current unit reviews, a population verdict, and completed naturalness transfers; it certifies structure, while an independent reader decides whether the creative contracts are satisfied.

`scopeIssues` also reports narrative layout, numbering, heading, body part-index, and identity failures from the captured inputs. Physical authored/support boundaries and aliases are captured during evaluation; classifying the same saved analysis never reinterprets a later filesystem state. Reevaluate to inspect changed inputs. The selected long-form screenplay preserves script paths, titles, anchors, and order, including the actual cited counterpart; expression working files preserve their frozen scene identities. Long-form body indexes provide navigation; a direct short can omit one, and frozen or working indexes need not duplicate them. Existing indexes still need current ordered links. A provided working index must have a body counterpart and is promoted with the same comment-free byte rule as other working files. A valid Evidence bijection alone cannot satisfy these structural responsibilities, and their failure blocks readiness without rewriting the native package report.

During a current naturalness review, the working text may still await promotion. `pendingNaturalnessTransfers` names differences between captured body inputs and the captured working text with comments removed. That pending current transfer does not by itself prevent the working-text reread, but it does prevent structural completion and downstream consumption. Keep the frozen construction throughout the revision, finish review in the working tree, promote its comment-free bytes, and refresh affected construction evidence and reviews before handing it downstream.

Exit code 1 preserves a failed whole-package report or incomplete structural completion. Missing current reviews or a pending current promotion can therefore leave exit 1 while `rereadReady` is true; read the reported fields to decide whether to begin review or repair prerequisites. Neither a selected pilot nor passing script structure certifies the complete rendered work.
