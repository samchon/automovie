# Production layout and supplied material

Use this resource when choosing source files, taking over existing work, or adapting the production's organization. These are default locations, not a request to create empty trees. Installed `@automovie/evidence` documentation owns supported layouts and selectors; [evidence configuration](../evidence/configuration.md) owns their use.

## Source ownership

| Location, when used | Owns |
| --- | --- |
| `PROJECT.md` | Project overview, commissioned scope, adopted choices, constraints and setup authority |
| `docs/instructions/NNN-topic.md` | Creative requirements, source boundaries and identified delegated writing choices |
| `docs/body/settings/NNN-domain/NNN-subject.md` | Canon facts, baseline states, and constraints with stable H2 identities |
| `docs/body/settings/outline/index.md` | Domain and file navigation without duplicating facts |
| `docs/body/treatments/NNN-event.md` | Flat ordered events, causes, consequences, and information release |
| `docs/body/scripts/NNN-part/NNN-episode.md` | Executable scenes and release partition, with part indexes |
| `docs/body/screenplay/NNN-part/NNN-episode.md` | Final audiovisual text preserving script identities and order |
| `docs/revision/screenplay/...` | Frozen reviewed construction originals for expression revision |
| `docs/naturalness/screenplay/...` | Expressive working versions and their evidence comments |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files |
| `docs/review/{draft,final}/<layer>/round-N/` | Independent construction and expression reviews, verdicts, and findings |
| `src/assets/` | Representations, rigs, and reusable authored controls |
| `src/shots/` | Deterministic staging, performance, camera, and sound choices |
| `src/film/` | The whole assembled motion hint or commissioned finished edit, captions, and sound placement |
| `src/integrations/`, when needed | Provider or local-tool integration code |
| `public/` | Retained fixed media and browser static inputs |
| Runtime `README.md` and `.env.example` | Nonsecret setup, commands, environment-variable names, and example configuration |
| Ignored local `.env` | Actual secret values required by adopted integrations |

A part can be an act, release block, or another division suited to the format. An episode file can hold a suitable sequence in a continuous film; its filename does not force an episodic release. Narrative partition and executable source organization are separate choices. A small program can combine source roles; split them where independent changes or reuse justify it, keeping each shared value with one owner.

Keep scene notation with [scripts](../screenwriting/notation.md) and creative responsibilities with [composition](../screenwriting/workflow.md#creative-ownership). Implementation may use as many or as few shots as the scenes need; preserve the relationship to the actual screenplay units and delivered edit.

## Intake of existing work

Preserve supplied settings, scripts, or completed works separately from new authored bodies, as actual documents or a verifiable source revision. Through [instructions](../screenwriting/brief.md#requirements), record their identity, adopted requirements, fixed quotations, and reinterpretation boundaries. Existing finished work supplies material and choices to assess; it does not approve this production's layers. `docs/revision` holds reviewed construction originals for expression passes, not unassessed reference intake.

## Execution and runtime setup

[Production](SKILL.md) owns the commissioned route. Use [3D modeling](../3d-modeling/SKILL.md) for source and representation, [motion](../motion/SKILL.md) for programmed performance and frame-time evaluation, and [audio](../audio/SKILL.md) for accepted sound. [Generation](generation.md) adopts fixed generated takes when commissioned; [finishing](finishing.md) supplies the actual host, edit, encoded artifact and handoff. A blank scaffold contains no viewer, render host or generation provider.

[Project context](profile.md) owns adopted scope, representation, providers/tools, setup authority and unresolved decisions. Keep actual commands and nonsecret variable names in README and `.env.example`, credentials in ignored local `.env`, and optional integration code in `src/integrations`. Read the installed APIs instead of duplicating callable behavior here.

## Project ownership and customization

Package upgrades never rewrite this production. Explicit CLI sync updates generated routers and bundled task resources, preserving contracts, configuration, adopted project decisions, authored source and proof. Stored instruction digests detect local conflicts; differing legacy instructions need their declared prior baseline. Keep custom criteria and decisions with their production owners rather than inserting them into generated procedures. Reusable checking implementation belongs to the installed `@automovie/evidence` package. Adapt language, subject-specific criteria, paths, and tools while preserving the chosen route's responsibilities and evidence relationships.

When changing a layout, keep selectors, imports, commands, links, identities, and actual consumers aligned. Update source and media answers through [their evidence method](../evidence/answering.md); changes touching narrative answers or closed reviews follow [upstream repair](../screenwriting/repair.md). Keep global routing in `AGENTS.md`, task goals and boundaries in skill overviews, and conditional detail in sibling resources linked directly from those overviews. Installed APIs own their callable behavior.
