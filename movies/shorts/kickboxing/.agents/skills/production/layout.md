# Production layout and supplied material

Use this resource when choosing source files, taking over existing work, or adapting the production's organization. These are default locations, not a request to create empty trees. Installed `@automovie/evidence` documentation owns supported layouts and selectors; [evidence configuration](../evidence/configuration.md) owns their use.

## Source ownership

Track current instructions, creative bodies, evidence, reviews and concise analysis. Keep one current record per purpose, identified by its actual inputs; Git preserves earlier tracked editions and reviews. Raw logs, classification tables and temporary comparisons belong in ignored `.cache/`, with their relevant conclusions in the current record. Native frozen and working screenplay paths under `docs/revision/` and `docs/naturalness/` are ignored local inputs retained while their cycle needs them.

| Location, when used | Owns |
| --- | --- |
| `PROJECT.md` | Project overview, commissioned scope, adopted choices, constraints and setup authority |
| `docs/instructions/*.md` | Creative requirements, source boundaries and identified delegated writing choices |
| `docs/body/settings/` | Canon facts, baseline states, and constraints with stable H2 identities |
| `docs/body/settings/outline/index.md` | Domain and file navigation without duplicating facts |
| `docs/body/treatments/NNN-event.md` | Flat ordered events, causes, consequences, and information release |
| `docs/body/scripts/NNN-part/NNN-episode.md` | Executable scenes and release partition, with part indexes |
| `docs/body/screenplay/<film>.md` for a short | Complete final audiovisual text; long work preserves its script partition |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files |
| `docs/review/{draft,final}/<layer>/<relative-file>.md` | Current independent unit reviews mirroring the actual body or working edition |
| `docs/review/{draft,final}/<layer>/verdict/index.md` | Current complete-population verdict, findings and author decisions |
| `docs/analysis/*.md` | Concise current research or production analysis linking its actual inputs and observations |
| `references/` | Durable research originals and useful excerpts, connected by one current `index.md` to their provenance and chosen use |
| `src/assets/` | Representations, rigs, and reusable authored controls |
| `src/shots/` | Deterministic staging, performance, camera and sound, including runtime shot plans |
| `src/film/` | The whole assembled motion hint or commissioned finished edit, captions, and sound placement |
| `src/integrations/`, when needed | Provider or local-tool integration code |
| `public/` | Retained fixed media and browser static inputs |
| Runtime `README.md` and `.env.example` | Nonsecret setup, commands, environment-variable names, and example configuration |
| Ignored local `.env` | Actual secret values required by adopted integrations |

A part can be an act, release block, or another division suited to the format. An episode file can hold a suitable sequence in a continuous film; its filename does not force an episodic release. Narrative partition and executable source organization are separate choices. A small program can combine source roles; split them where independent changes or reuse justify it, keeping each shared value with one owner.

Retain research files across sessions; this archive is outside scratch cleanup and runtime publication. Keep material whose redistribution is restricted or unconfirmed in ignored `references/private/`. Place openly reusable copies in `references/licensed/` only with verified terms and required attribution. Even a large licensed original is research input, not automatically a browser asset. [Research](research.md) owns inspection and the current index; an actual runtime consumer adopts permitted assets separately.

Keep scene notation with [scripts](../screenwriting/notation.md) and creative responsibilities with [composition](../screenwriting/workflow.md#creative-ownership). Implementation may use as many or as few shots as the scenes need; preserve the relationship to the actual screenplay units and delivered edit.

## Intake of existing work

Identify supplied settings, scripts or completed works by their original source revision or retained reference. Through [instructions](../screenwriting/brief.md#requirements), record their identity, adopted requirements, fixed quotations, and reinterpretation boundaries. Existing finished work supplies material and choices to assess; it does not approve this production's layers.

## Execution and runtime setup

[Production](SKILL.md) routes the commissioned work to its specialists. Read the actual source entry, runtime configuration and installed APIs before adopting a host or integration; available files alone do not prove working playback or export. [Finishing](finishing.md) verifies that path and the assembled artifact. Select an external generation service only for a commissioned generation workflow.

[Project context](profile.md) owns operating choices and authority. README and `.env.example` document the actual commands and nonsecret configuration; ignored `.env` holds credentials. Optional integration code belongs in `src/integrations`. Installed APIs own callable behavior.

## Project ownership and customization

Package upgrades never rewrite this production. Authorized AutoMovie CLI sync updates generated routers and bundled task resources while preserving contracts, configuration, project decisions, content and proof. Inspect its check result before applying; the installed CLI's README or `automovie --help` owns the invocation and baseline handling. Stored instruction digests detect local conflicts, and differing legacy instructions need their declared prior baseline. Keep custom criteria and decisions with their production owners. Reusable checking belongs to installed `@automovie/evidence`; adapting paths, language or tools preserves the route's duties and actual relationships.

When changing a layout, keep selectors, imports, commands, links, identities, and actual consumers aligned. Update source and media answers through [their evidence method](../evidence/answering.md); changes touching narrative answers or closed reviews follow [upstream repair](../screenwriting/repair.md). Keep global routing in `AGENTS.md`, task goals and boundaries in skill overviews, and conditional detail in sibling resources linked directly from those overviews. Installed APIs own their callable behavior.
