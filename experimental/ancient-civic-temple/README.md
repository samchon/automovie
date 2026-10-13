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
| `npm run viewer -- --port 4175` | Run the typed native producer and browser compiler through `ttsx -P package.json`; serve generated ESM for both the building and model board. |

The scaffold provides instructions, contracts, and source lint, not prewritten production or viewer code. Author only the concrete source the requested work needs through the packages' public APIs. It supplies no film build, capture, render, or publication command.

Model contact and clearance claims need measurements of the actual compiled geometry. Earlier PASS links and prose-derived occupancy boxes do not establish those relations. The following curved-part swept-path relations remain unmeasured; their host geometry and assembly state need direct geometric evaluation before a clearance claim can be made.

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

## Visual work

When the task needs a model view, building walkthrough, or film playback, follow [Live viewing](.agents/skills/review-verification/live-viewing.md) to implement the required view over the production's own source. A page and its controls are authored for that need, not selected from seeded viewer templates.

The building and model-board viewers consume the active spatial, model, material, and placement source. Their current branch stages are declared in `lint.config.ts`. A stage declaration or successful source check does not establish visual completion: inspect actual frames, joints, material response, and the recorded unresolved questions through the linked review procedure.

## Ownership

- All source code belongs under `src`, including command entry points, viewer code, review declarations, and any test source. The typed production declaration is the one exception: `lint.config.ts` sits at the project root, where the compiler plugin and the production resolver both read it. Source location does not make tooling a production design owner; the typed evidence declaration selects the authored populations.
- `public` holds HTML and static assets. Keep executable code in imported `src` modules rather than inline HTML scripts or asset directories.
- `docs` holds authored decisions, contracts, and review observations. Git holds change history. Neither is replaced by a generated state ledger.
- `package.json` is the only project JSON file. Keep package and compiler settings there; do not create another JSON configuration, design store, registry, migration journal, receipt, or cache file in the project.
- Execute production and measurement functions over typed values. Images, media, and reader-facing documents are outputs; serialized project state is not an authoring product.

Run the applicable [Author process Self-Review](.agents/skills/review-verification/self-review.md) before handing off a completed authoring, evidence, review, or stage-transition boundary.
