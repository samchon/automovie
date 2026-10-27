# Production layout and supplied material

Use this resource when choosing source files, taking over existing work, or adapting the production's organization. These are default locations, not a request to create empty trees. Installed `@automovie/evidence` documentation owns supported layouts and selectors; [evidence configuration](../evidence-configuration/SKILL.md) owns their use.

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
| `docs/revision/{scripts,screenplay}/...` | Frozen reviewed construction originals for expression revision |
| `docs/naturalness/{scripts,screenplay}/...` | Expressive working versions and their evidence comments |
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

Keep scene notation with [scripts](../scripts/notation.md) and creative responsibilities with [composition](../storytelling/composition.md). Implementation may use as many or as few shots as the scenes need; preserve the relationship to the actual screenplay units and delivered edit.

## Intake of existing work

Preserve supplied settings, scripts, or completed works separately from new authored bodies, as actual documents or a verifiable source revision. Through [instructions](../instructions/SKILL.md), record their identity, adopted requirements, fixed quotations, and reinterpretation boundaries. Existing finished work supplies material and choices to assess; it does not approve this production's layers. `docs/revision` holds reviewed construction originals for expression passes, not unassessed reference intake.

## Representation and execution

The screenplay states the complete intended audience experience. A movie hint requires [programmed motion](../motion/SKILL.md) and staging for the main scenes and assembly into the whole video. Motion owns choreography, constraints, scene time, and engine feedback; [3D modeling](../3d-modeling/SKILL.md) owns the asset representations it uses. Choose deterministic performance and scene cues that accurately carry that action. A stick figure, block figure, or coarse mesh can suffice, and important objects can use coarse frames when their interaction remains clear. Objects irrelevant to that performance can remain in the screenplay description.

Use [3D modeling](../3d-modeling/SKILL.md) for representation and acquisition choices. Fixed 2D generated images can support assets or appearance; they do not replace a commissioned whole motion hint. Detailed 3D, multi-view recovery, and deformation or control needs follow that skill's branches. Human is optional. Keep external generation outside deterministic replay and retain the actual media used.

Choose and wire the real execution or delivery entry before claiming a runnable artifact; the blank scaffold supplies no viewer, render host, or media provider. Prove a representative render and media path before scaling, then complete and assemble the commissioned scope. [Delivery review](../delivery-review/SKILL.md) judges a separately commissioned screenplay, whole motion hint, finished direct 3D film, or finished post-diffusion film. A pilot is not the whole motion hint, and the hint is not a finished diffusion film.

## Production decisions and runtime setup

Use [production decisions](profile.md) to record the commissioned scope, delivery method, representation, providers or local tools, runtime and setup authority in root `PROJECT.md`. Creative instructions remain under `docs/instructions`. Sound and its acquisition follow [audio](../audio/SKILL.md), including a direct 3D film's actual audio requirements. Preserve a manuscript-only commission as its own explicit scope.

Keep executable setup, commands, and nonsecret variable names in the runtime README and `.env.example`. Actual secrets belong in ignored local `.env`, and optional provider or local-tool code belongs in `src/integrations`. Installed APIs own callable behavior; [development](../development/SKILL.md) owns source and setup implementation.

## Project ownership and customization

Installed instructions, contracts, configuration, and authored source belong to this production; package upgrades never migrate them. Reusable checking implementation belongs to the installed `@automovie/evidence` package. Adapt language, subject-specific criteria, paths, and tools while preserving the chosen route's responsibilities and evidence relationships.

When changing a layout, keep selectors, imports, commands, links, identities, and actual consumers aligned. Route affected answers and reviews through [upstream repair](../upstream-repair/SKILL.md). Keep global routing in `AGENTS.md`, task goals and boundaries in skill overviews, and conditional detail in sibling resources linked directly from those overviews. Installed APIs own their callable behavior.
