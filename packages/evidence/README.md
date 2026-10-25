# @automovie/evidence

Configure engineering evidence and optional narrative validation with one object. The package owns graph composition, runtime identity, captured-input validation, and pass reporting. Each production owns its instructions, checklists, creative bodies, evidence, and review records.

## Configuration

Export the result directly from the project's `evidence.config.ts`:

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({ location: import.meta.dirname });
```

This default selects exported source types/functions under `src/**/*.ts` against `.agents/skills/contracts/common.md`, and exported test functions under `test/**/test_*.ts` against `contracts/testing.md`. It selects no narrative and needs no story files, mode, or stage flags. `location` is the absolute project directory; native Evidence resolves the selected files relative to the authored config file.

For a video, add `narrative` to that same object. This short-form example activates a complete final screenplay's two evidence passes:

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short",
    construction: { screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
```

Choose `mode: "long"` for settings → treatments → scripts → final screenplay. Unspecified construction and expression layers are disabled drafts; an omitted outline stage follows settings. Unspecified scope is the complete work. Compose a complete draft before activating its evidence. Scripts and screenplay each retain construction and expression passes; settings and treatments finish within construction. A disabled stage or passing graph never grants creative approval.

The factory derives lifecycle and actual implementation/compiler identities. Callers do not supply synthetic gate hashes or parallel ownership arrays. Narrative creation resolves the project's installed `ttsc` and the package's actual Evidence dependency; it rejects `TTSC_BINARY` overrides. Changing project options does not change the library implementation digest.

The [input type](src/IAutoMovieEvidenceConfigProps.ts) and [narrative options](src/IAutoMovieNarrativeProps.ts) own option details. Supplied `claims` replace the default engineering claims; use `createEngineeringClaims()` when appending to them. Defaults are fresh objects, and supplied claim graphs and stage options are copied during creation. Keep the returned narrative config unchanged after submission; validation requires its original factory identity.

## Work and language requirements

Production-owned language and work questions live under `.agents/skills/contracts/story/{language,work}`. The shared graph retains unit principles, population obligations, discovery, upstream repair, expression revision, and independent review. Each extra narrative claim carries its native `claim` with a unique name, plus the exact owning `layer` and `pass`, in one [record](src/IAutoMovieNarrativeClaim.ts). The factory derives the matching claim scope. Inactive owners, duplicate names, and unsupported pass ownership are rejected.

Built-in language discovery uses `language/discovery/questions.md`. Unit questions use `language/principles/` for construction and `language/naturalness/` for expression; population questions use `language/obligations/` and `language/naturalness/obligations/`. Each family discovers installed `common.md`, `narratives.md` for treatments/scripts/screenplay, `realized.md` for scripts/screenplay, and the current `<layer>.md`. Expression families apply only to scripts and screenplay. Other filenames are not discovered automatically.

The advanced builders [createPackageChecklistClaim](src/narrative/createPackageChecklistClaim.ts) and [createPackagePopulationContract](src/narrative/createPackagePopulationContract.ts) distinguish work-local unit/file duties from obligations answered once per complete layer; attach each returned claim to its actual layer and pass through the same record.

Global engineering claims cannot consume authored body, revision, naturalness, evidence, review, instructions, or story-contract inputs. That protection includes physical/logical aliases and regular-file hard links throughout those trees, including inactive layers, disabled descendants, and material outside a selected pilot. Duties consuming protected material belong to explicitly owned narrative claims. Independent copied bytes remain independent files.

Installed `@wrtnlabs/evidence` documentation owns native selectors, annotation syntax, relationship constraints, and review fingerprints. The `@automovie/evidence/narrative` entry exports the graph, pass-analysis, contract, and metadata-rewrite primitives for advanced consumers; its declarations own their exact inputs and ownership requirements.

## Narrative files

| Path | Owner |
| --- | --- |
| `docs/instructions/*.md` | Adopted requirements |
| `docs/body/settings/001-topic.md` or `settings/001-subject/001-topic.md` | Canon; flat and classified layouts cannot mix |
| `docs/body/settings/outline/index.md` | Canon outline |
| `docs/body/treatments/001-event.md` | Flat event sequence |
| `docs/body/{scripts,screenplay}/001-part/001-scene.md` | Scene execution and final audiovisual realization |
| `docs/evidence/construction/{files,units}/<layer>/<relative-file>.md` | Detached construction answers |
| `docs/revision/{scripts,screenplay}/<relative-file>.md` | Frozen construction |
| `docs/naturalness/{scripts,screenplay}/<relative-file>.md` | Working expression edition and comment evidence |
| `docs/review/{draft,final}/<layer>/round-N/<relative-file>.md` | Current unit reviews |
| `docs/review/{draft,final}/<layer>/round-N/verdict/index.md` | Whole selected population verdict |

Narrative scene files use one leading H1 and H2 units, contiguous numbered paths, and no deeper headings. Long body parts have `index.md` navigation with current ordered scene links and titles. Long screenplay preserves script paths, titles, anchors, order, and the exact cited counterpart. An absent short, frozen, or working index is optional; a provided working index requires its body counterpart and exact promotion with comments removed. Matching visible H2 titles remain valid when explicit anchors distinguish their units.

A first-part pilot uses the exact selected part in `narrative.scope`. Settings remains work-wide; event and scene coverage follows the declared slice. Restore complete-work scope and complete populations before claiming whole-work completion. Production skills and guides own composition, independent reading, upstream repair, and actual delivery procedures.

## Pass command

The generated project's `production.check.ts` supplies its original config and arguments to `runProductionCheck`, then uses the returned exit status:

```ts
import { runProductionCheck } from "@automovie/evidence";

import config from "./evidence.config";

process.exitCode = await runProductionCheck({
  config,
  args: process.argv.slice(2),
});
```

Its project command accepts `--layer <settings|treatments|scripts|screenplay>` and `--pass <construction|naturalness>`. The command evaluates the original complete native graph, preserving `packageReport` and `packageSuccess`. `rereadReady` identifies a pass ready for independent reading; `approvalStructureReady` additionally requires current unit reviews, a population verdict, valid topology and lineage, and completed transfers. Neither field issues a creative verdict or proves a rendered film realizes the screenplay.

`scopeIssues` reports captured-input structural failures. `pendingNaturalnessTransfers` compares working text, with every HTML comment removed, to the corresponding captured body bytes. A pending current promotion can permit a working-text reread but blocks structural readiness for completion and downstream consumption. Exit status 1 can therefore coexist with `rereadReady: true`; inspect the reported prerequisites before choosing review or repair.

Analysis captures physical aliases and protected identities during evaluation. Reclassifying an `analyzeProductionPass` result with the same original config reads only that capture, even after later filesystem changes. A raw native evaluation or different config cannot supply missing provenance. Reevaluate to inspect changed inputs. No wrapper rewrites native graph success to conceal a frozen downstream failure.

## Provenance and development

The narrative implementation adapts [`wrtnlabs/wrtn-novels` config](https://github.com/wrtnlabs/wrtn-novels/tree/a26ab06ebf31ee5b2aa85979fce1881b2898be7e/packages/config/src) and [CLI structure checks](https://github.com/wrtnlabs/wrtn-novels/tree/a26ab06ebf31ee5b2aa85979fce1881b2898be7e/packages/cli/src/internal) at `a26ab06ebf31ee5b2aa85979fce1881b2898be7e`, replacing the final prose layer with audiovisual screenplay. The original MIT notice is retained in [LICENSE.novels](LICENSE.novels). The generated project's skills and contracts retain their own upstream notice and responsibility map.

Node 22.23.2 or newer is required. Workspace development uses `pnpm --filter @automovie/evidence build` and `pnpm --filter @automovie/evidence evidence`. Tests call workspace source exports and the real Evidence APIs in-process; installing a generated consumer is not their execution layer.
