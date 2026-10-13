# future-citizen-house

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

The scaffold provides instructions, contracts, and source lint, not prewritten production or viewer code. Author only the concrete source the requested work needs through the packages' public APIs. It supplies no film build, capture, render, or publication command.

The installed `automovie` CLI separately provides Markdown TOC maintenance, external-asset inspection, and capability routes. Read its local help before invoking a command. These operations do not authorize a project state store.

## Visual work

When the task needs a model view, building walkthrough, or film playback, follow [Live viewing](.agents/skills/review-verification/live-viewing.md) to implement the required view over the production's own source. A page and its controls are authored for that need, not selected from seeded viewer templates.

## Ownership

- All source code belongs under `src`, including command entry points, viewer code, review declarations, and any test source. The typed production declaration is the one exception: `lint.config.ts` sits at the project root, where the compiler plugin and the production resolver both read it. Source location does not make tooling a production design owner; the typed evidence declaration selects the authored populations.
- `public` holds HTML and static assets. Keep executable code in imported `src` modules rather than inline HTML scripts or asset directories.
- `docs` holds authored decisions, contracts, and review observations. Git holds change history. Neither is replaced by a generated state ledger.
- `package.json` is the only project JSON file. Keep package and compiler settings there; do not create another JSON configuration, design store, registry, migration journal, receipt, or cache file in the project.
- Execute production and measurement functions over typed values. Images, media, and reader-facing documents are outputs; serialized project state is not an authoring product.

Run the applicable [Author process Self-Review](.agents/skills/review-verification/self-review.md) before handing off a completed authoring, evidence, review, or stage-transition boundary.

## Current rewrite

Following the coordinator's 2026-09-21 correction, the rewrite proceeds in place. The settings, spaces, and spaceSources declarations stay at review, and the verdicts of the generation before the rewrite were invalidated. An independent reviewer re-examines the checks reopened by the revised text and source and the comparison against the actual GPU screen. [Restart review](.wiki/99-worklog/2026-09-21-reassessment.md#restart-review) and [Authoring authority](docs/settings/001-production.md#runtime-and-restart) own the scope and the decision.

The rejected Canvas2D implementation was removed and the path production-internal CJS server → public engine → WebGL client was written. The new house shape was rewritten in place as complete owners of the elevations, storeys, stair, 12 rooms, and site. The viewer runs the same typed producer as CommonJS, and a separate canonical lint performs evidence verification. Opening coordinate, building-level root, and door-leaf origin errors that surfaced in an actual run after installing tsx were repaired. three and @types/three are declared in package.json and the coordinator installed them. Independent verdict v-071 judged PASS the visual axis in which settings, spaces, spaceSources, and the five references read as the same building. The simplicity of materials, members, and furniture, which was its caveat, remains a target for later improvement. The canopy was closed at v-076 with a PASS that included the design trace of the landscape relocation. The actual WebGL2 RENDERER that v-076 recorded is `ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)`. Do not read this verdict history as a new GPU run on the current tree or as completion of the whole finish.

The coordinator's start command, from this production directory, is `npm run viewer -- --port 4174`. `--port` accepts an integer in 1–65535 and defaults to 4174, the port assigned to 1953. The path to open is `http://127.0.0.1:4174/`. This command runs the TypeScript server with `ttsx -P package.json`. The browser entry point is TypeScript as well, and only the ESM produced by the server's Vite build is served under `/assets/`. Type and evidence verification is performed by the existing `npm run lint` with the same package.json compilerOptions as the whole source. The check plugin, stage, requireReview, and the engine's CommonJS boundary are kept. Runtime syntax, module-loading, and native geometry errors fail as they are, and a successful server run does not mean a lint pass or an independent visual verdict. The fixed-size capture path is `http://127.0.0.1:4174/?capture=1`, where the canvas uses 1600×1000 CSS pixels and pixel ratio 1. The coordinator starts the server and replaces an existing process. A source change invalidates the existing screen, so after lint the coordinator restarts the server.

On 2026-09-24 the plan extent of the four upper slab pieces was reduced to the exterior wall centre planes (x=±5.38, z=±5.88). Previously they extended to the outer boundary x=±5.50, z=±6.00 and formed the same plane as the outer face of the elevation stone panels at y=2.908..3.184. That was a source defect that violated "do not generate the same face twice" in [Surface decomposition](docs/settings/003-spatial-basis.md#surface-decomposition), and it is a precondition of the material binding of the [floor band](docs/materials/002-exterior-solids.md#opaque-floor-band). The slab piece count, IDs, stair hole, and exterior appearance are unchanged, and the slab edges are buried inside the exterior wall bodies.

The current implementation provides perspective, PBR, shadows, luminaire light sources, keyboard control, day/private/night shading, and the work/guest bed states. It derives the observation list from the current cells, surfaces, connectors, faces, and openings of the same CJS producer and also keeps failed positions. The section cut and outlines turn on only in inspection mode. The information panel reads the public engine diagnostics, room/storey containment and reachability, individual tread bounds, and the door-passage cylinder check against the actual triangles. The continuous cylinder collision of the whole in-room circulation and the stair ascent, and structural, code, energy, and actual building-services performance are unverified. Implementation of later materials, glazing, shading, furniture, and landscape and the corresponding visual verdicts remain separate.

## Canopy r2 implementation

The [roof owner](src/house/envelope/roof.ts), the [right elevation](src/house/envelope/right.ts), and the [site](src/house/site/garden.ts) implement the [v-073 submitted design](docs/spaces/003-surface-ownership.md#roof-face). The design document's existing description of source members is kept as the record at the time of the v-073 submission. The current source generates the open frame and PV, the main beams, segmented rails, and posts, the pitched roof, and the gutters, downpipes, and drainage inlet as actual geometry. The graph of fixed rooms, storeys, doors, and the stair is kept.

The viewer's `/scene` response includes the `canopyAudit` executed by the same `buildHouse()`. It exposes actual part bounds, opening extension regions, the strainer withdrawal path, and counts, and adds per-member inspection positions to the existing observations. These numbers and some GPU captures do not mean an overall visual pass or a certification of structural, drainage, or equipment performance. v-076 closed the canopy and the related landscape basis; the later curtain wall, glass, finish, furniture, and landscape design remain. The existing orientation problem of the elevation normals used for observation is also left to the next elevation design.

## Canopy visual re-review v-074

v-074 passed the canopy dimensions, members, and drainage implementation and rejected the visual representation of the black continuous PV surface. The current repair keeps the approved mesh, layout, and spacing and changes the [canopy material](src/house/canopy-finish.ts), the surface owner's material binding, and the [viewer illumination](src/viewer/illumination.ts). The PV cells are a repeated material fitted to the metre UVs of the actual mesh, not a photograph or substitute geometry. The glass between cells is approximated with alpha compositing of a thin surface, and the shadow with a cell mask. Do not read them as the real light transmittance, refraction, or generation performance.

The sky environment provides the same reflected light to every camera. The existing sun direction and exposure are kept and the shadow resolution was raised. Interior luminaires are projected as downlights, and light sources removed by the section cut are excluded with it, which prevents the false light spots that remained in the lower inspection. The observations keep the existing required set and the five references. v-075 confirmed the cell spacing, frame, and rail rhythm of this canopy representation in actual GPU captures and judged it a visual PASS.

The reduction of front landscaping is the intended relocation that cleared the 2m maintenance equipment access strips on both sides and the front cassette work strip. Completing the [design basis for landscape relocation and preservation](docs/spaces/003-surface-ownership.md#roof-face) that v-075 pointed out, the destinations, preservation range, and garden owner of 4 trees, 48 shrub groups, and the low grass were linked. None of those shapes were deleted. The impression that the front is emptier than before remains, and later landscape design must resolve it. v-076 judged PASS both this design trace and execution link and the canopy's fidelity and visual axis.

## Current material delivery scope

[Assembly.material](src/house/assembly.ts) creates a native material from the material name the surface owner assigns. Currently only `pv` uses the [cell colour and alpha texture](src/house/canopy-finish.ts), and every other material name is drawn with its stated flat colour and roughness. The procedurally generated texture PNGs and the [generation code](src/materials/generate-textures.mjs) are kept, but while the material binding is retired they are not bound to the non-PV surfaces on screen. The material binding resumes at materialSources draft after materials review. Recovery point: `src/materials/bindings.ts` and `src/house/assembly.ts` at `36eec2d161f9438ef04414073a207fda855d1bdc`.

The [viewer's material uploader](src/viewer/scene.ts) passes native colour, roughness, metallic, emissive, transmission, ior, thickness, clearcoat, and a baseColorTexture whose UV comes from the primary UV or a surface-metres projection. If a normalTexture, metallicRoughnessTexture, occlusionTexture, or emissiveTexture is present it raises an explicit error. Adding such a texture to the source therefore does not by itself make it appear on screen. Since 2026-09-24 the uploader gathers every part placement that shares the same native material record into one static batch baked in world coordinates. The instance palette moves into vertex colour ratios, a mirror transform flips the winding, and each batch keeps the list of placement ids it holds. The same texture asset shares one GPU source. On this machine's channel chromium (AMD 8060S, D3D11), draw calls per frame fell from 499~1,078 to 52~54, and frame time went from 43→16ms for the exterior and from 31~56→22~42ms for the interior. The pixel change at the eight fixed-camera observations is 0.003~0.094%, with a mean absolute difference of 0.0025 or less. The default exterior's initial camera moved by about 4cm because the bounds became tight to the actual vertices. Even as the number of material variants grows, draw calls follow the number of finishes. This limit is the current support scope of the production viewer, not a verdict on what the engine supports. The reflection and transmission values are authored representation values, and measured optical performance is unverified. Material design, source delivery, and visual confirmation follow the [design branch procedure](.agents/skills/source-authoring/design-branches.md) and the [precedence gate](.agents/skills/evidence-graph/staging.md#transitions).

The [material design](docs/materials/001-binding-and-scale.md) decomposes the opaque envelope, glass/PV, wood, textile/paint, and wet finishes. The [observation set](docs/materials/007-observation.md) adds distance, joint, and state samples to the full current topology observation and the five references. After the design PASS at v-082 it advanced to `materials: evidence` on 2026-09-24 and added the [common](docs/accounts/materials/core-common.md) and [materials](docs/accounts/materials/design-materials.md) obligation accounts. Because it is not yet at `materials: review`, which the [precedence gate](.agents/skills/evidence-graph/staging.md#transitions) requires, the materialSources declaration is inactive. Binding recovery and actual material source verification remain for the stage after that. The earlier binding and the before/after captures are not recorded as a formal material source or a full visual PASS. New glazing depth, shading, and furniture shapes are not approved by this design.
