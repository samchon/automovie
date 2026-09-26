# ancient-civic-temple

This is a coding-agent-first AutoMovie production repository. Author production facts, construction and final screenplay documents, source, assets, and delivery indexes as ordinary tracked files. Production execution consumes typed source directly.

## Authoring routes

`AGENTS.md` is the shared coding-agent entry point. It routes contract lookup through the [contract skill](.agents/skills/contract/SKILL.md), production work through [production lifecycle](.agents/skills/production-lifecycle/SKILL.md), graph changes through [evidence graph](.agents/skills/evidence-graph/SKILL.md), implementation through [source authoring](.agents/skills/source-authoring/SKILL.md), and observation or completion through [review verification](.agents/skills/review-verification/SKILL.md). Read the current production selection and claims from `lint.config.ts` and their actual owners from `docs`; the entry point is not a generated facts inventory.

Use [Production kinds](.agents/skills/production-lifecycle/production-kinds.md) before selecting `kind` in `lint.config.ts`. Use [Production documents](docs/README.md) for physical document ownership, [Contract targets](.agents/skills/evidence-graph/contract-targets.md) for shared and language target forms, [Production-specific contract](.agents/skills/evidence-graph/work-specific.md) for local discovery results, and [Evidence staging](.agents/skills/evidence-graph/staging.md) before changing a branch stage or evidence annotation. Those routes own their semantics; this README only makes them reachable.

## Static-document updates

Scaffold installation is one-way. After creation, `AGENTS.md`, `CLAUDE.md`, `.agents/skills`, contracts, READMEs, configuration, and source are project-owned tracked files. The coding agent maintains them through ordinary reviewed edits and commits; package upgrades do not regenerate or overwrite them. Adopt an upstream instruction or contract change only as an explicit project change, preserving authored content and reconciling its affected callers, claims, and reviews.

Use ordinary coding-agent tools for authoring. Scaffold creation does not register an MCP client or write client configuration.

## First run

```bash
npm install --package-lock=false
npm run lint
```

The blank scaffold is intentionally incomplete. Select the production kind through the routed lifecycle procedure, author its prerequisites, then use the commands below at the stages their linked procedures name.

## Canonical command routes

Use the commands declared in `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run lint` | Check the complete TypeScript program and active authored evidence. |
| `npm run format` | Format source with the configured compiler formatter. |
| `npm run review-audit` | Run lint, tests, self-check, and eight benchmark probe invocations, including document review aids for models and spaces; set `AUTOMOVIE_BENCH_PROBES` when the probes are outside `D:/AutoMovieBench/probes`. Probe flags are reading leads, not review verdicts. |

The scaffold provides instructions, contracts, and source lint, not prewritten production or viewer code. Author only the concrete source the requested work needs through the packages' public APIs. It supplies no film build, capture, render, or publication command.

The model contact census uses exact approved phrases for the eight older model files as a change detector (문구 고정(변경 감지)); a harmless rewording can require a renewed review. Its 91 original PASS links are not independent measurements; six added geometric joint claims use reconstructed part intersections or contact. The `portable` and `ritual` files instead enter a generated census: 14 sentences have measured part contact, ten have derived geometric relations, and 52 are classified as descriptions, review instructions, or instance-owned contacts. At this revision, `model-prose-consistency.mjs` reports 579 part-bound and union rows across 44 occupancy-box H2s, 22 part-contact rows, five wall-contact rows, 16 shape-relation rows, two polygonal tube rows, and ten positive part-box overlaps checked against declared assembly relations. It splits repeated components, hollow radial parts, bent plates, cut beams, and roof/wall mating faces before treating an enclosing box as solid. An unparsed part axis or occupancy box fails visibly; a remaining positive overlap needs a named construction relation, with any stated insertion depth checked against the recovered intersection.

Polygonal tube-to-host clearance is measured only for `portable#bucket`. The following curved parts have recovered occupancy axes, but their swept-path clearance against a host is outside that checker. Their host geometry or assembly state needs a separate sweep grammar before a clearance claim can be made.

| H2 | Part | Unmeasured relation axis | Reason |
| --- | --- | --- | --- |
| `fixtures#fountain` | `ripple` | curve ↔ water/nozzle | A water-surface ring and nozzle need separate radial hosts. |
| `openings#double-door-leaf` | `ring` | curve ↔ plate/pin | The ring sits on both leaf faces and joins pins. |
| `openings#single-door-leaf` | `ring` | curve ↔ board/pin | The ring and pin move with the leaf. |
| `portable#carrying-yoke` | `hook` | curve ↔ beam | The YZ hook joins a straight crossbar. |
| `portable#rope-coil` | `rope` | concentric curves ↔ tie | Three coiled rings share a transverse tie. |
| `ritual#jar-stand` | `ring` | annulus ↔ post | The annular contact band surrounds an open centre. |
| `wares#storage-jar` | `handle` | curve ↔ vessel profile | The vessel shoulder is a revolved shell. |
| `wares#carry-jar` | `handle` | curve ↔ vessel profile | Two attachment ends meet the revolved shoulder. |
| `wares#small-vessel` | `handle` | curve ↔ vessel profile | The small handle meets a tapered shell. |
| `wares#basket` | `rim` | curve ↔ woven wall | A toroidal rim caps a woven shell. |
| `wares#scroll` | `tie` | curve ↔ rolled paper | Three variants have distinct cylinders and wrap paths. |

The installed `automovie` CLI separately provides Markdown TOC maintenance, external-asset inspection, and capability routes. Read its local help before invoking a command. These operations do not authorize a project state store.

## Visual work

When the task needs a model view, building walkthrough, or film playback, follow [Live viewing](.agents/skills/review-verification/live-viewing.md) to implement the required view over the production's own source. A page and its controls are authored for that need, not selected from seeded viewer templates.

The current viewer renders the structural space source in neutral review clay. Model source resumes only after `models` passes independent review and `modelSources` enters `draft`. The retired model prototypes, dependent object assembly and placements, source-only tests, and `src/geometry/jar-rack-board.ts` are recoverable from commit `ac4b6cb4`. Restore the rack geometry inside its `src/models` class when that layer opens. Material bindings resume after `materials` passes independent review and `materialSources` enters `draft`; the binding source is recoverable from commit `ce41e8a0`. The texture assets, generator, and material design draft remain in the active tree.

## Ownership

- All source code belongs under `src`, including command entry points, viewer code, review declarations, and any test source. The typed production declaration is the one exception: `lint.config.ts` sits at the project root, where the compiler plugin and the production resolver both read it. Source location does not make tooling a production design owner; the typed evidence declaration selects the authored populations.
- `public` holds HTML and static assets. Keep executable code in imported `src` modules rather than inline HTML scripts or asset directories.
- `docs` holds authored decisions, contracts, and review observations. Git holds change history. Neither is replaced by a generated state ledger.
- `package.json` is the only project JSON file. Keep package and compiler settings there; do not create another JSON configuration, design store, registry, migration journal, receipt, or cache file in the project.
- Execute production and measurement functions over typed values. Images, media, and reader-facing documents are outputs; serialized project state is not an authoring product.

Run the applicable [Author process Self-Review](.agents/skills/review-verification/self-review.md) before handing off a completed authoring, evidence, review, or stage-transition boundary.
