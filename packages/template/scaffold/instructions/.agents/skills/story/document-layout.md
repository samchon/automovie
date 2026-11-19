# Document layout

## Documents

Create a listed location only when used. The installed evidence package defines supported selectors and layouts. See [configuration](../evidence/configuration.md) for selection.

Commit instructions, bodies and Evidence answers. Keep review records local. Identify each current record by its actual inputs. Keep logs, classifications, performance plans and working comparisons in ignored `.cache/` and copy material conclusions into the current record.

| Location, when used | Owns |
| --- | --- |
| `docs/instructions/*.md` | Creative requirements, source boundaries and identified delegated writing choices |
| `docs/body/settings/<domain>/<subject>.md` | One subject's facts, one file per subject |
| `docs/body/settings/outline/index.md` | Domain and file navigation without duplicating facts |
| `docs/body/brief/<domain>/<subject>.md` | A short's brief, one subject per file in a settings domain |
| `docs/body/treatments/NNN-event.md` | Flat ordered events, causes, consequences, and information release |
| `docs/body/scripts/NNN-part/NNN-episode.md` | Executable scenes and release partition, with part indexes |
| `docs/body/screenplay/<film>/NNN-<scene>.md` | Complete final audiovisual text, one file per scene |
| `docs/research/index.md` | The source index |
| `docs/research/<discipline>/<topic>.md` | The studies of each practice and style |
| `references/` | Retained research originals that are permitted copies |
| Ignored `references/private/` | Retained research originals whose rights are unconfirmed |
| `docs/contracts/work/...`, `docs/contracts/language/...` | This production's own story contract items and their criteria |
| `docs/acceptance/<film>.md` | The film's tracked acceptance record |
| `docs/acceptance/catalog.md` | The catalog's accepted cases |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files |
| Ignored `docs/review/draft/<layer>/<relative-file>.md` | Current independent unit reviews mirroring the actual body |
| Ignored `docs/review/draft/<layer>/verdict/index.md` | Current complete-population verdict |

The verdict file also holds the findings and the author's decisions on them.

The screenplay takes one folder per delivered video, from whose path the [film name](../development/source-layout.md#source) derives, and one file per scene, ordered by its number. On the long route the file is `NNN-part/NNN-episode/NNN-<scene>.md`.

The research studies hold laws, limits and measurable targets. Their construction answers are whole-file answers, in `files/research/` of the evidence location.

The production's own story contracts supplement the shared ones and are cited as `work/...` and `language/...`. Discovery writes `work/discovery/results.md` among them.

The film's record follows [delivery review](../review/delivery-review.md#acceptance-record) and the catalog's follows [catalog review](../motion/catalog-cases.md#record). See [project context](../production/project-context.md) for `PROJECT.md` and [media records](../production/media-records.md) for generation requests.

A part can be an act, a release block or another division suited to the format, and an episode can hold a sequence of a continuous film without forcing an episodic release. Narrative partition and [source organization](../development/source-layout.md) are separate choices.

## Canon records

Give each settings or brief subject one file in its domain. Its production-relative path identifies the subject across scenes and films. Use H1 for the subject, H2 for facets and anchored H3s for facts and decisions. Cite the fact by path and [anchor](layers/notation.md#identities).

For commissioned appearances on a route with no settings or brief, use `docs/instructions/appearance-<subject>.md` as the subject record. Preserve user-fixed interpretations. Embed commissioned [canon references](../image/canon-references.md) from `media/diffusion/images/<domain>/`. Report conflicting sources or instructions and resolve inconsistencies at their owner.

### Scene elements

Before writing a screenplay scene's action, identify its places, people, objects and groups in the [standing state](layers/notation.md#records). Link existing subjects. Give each scene-only instance the action tracks a stable name scoped to the scene file. Two keys may share one design and still be `house-key` and `spare-key`. Use natural descriptions in the action.

Track an element individually when its position, use, state or identity matters to the action or continuity. Account for the rest as set dressing or a group. A change of holder, appearance or camera preserves the subject's identity. When a later scene needs a local subject, give it a shared record and point the earlier use to it. On a route without canon layers, instructions own shared definitions and implementation details of a fixed screenplay.

## Intake of existing work

Identify supplied work by revision or retained reference. Record requirements, fixed quotations and reinterpretation limits in [instructions](planning/requirements.md#requirements). Apply the chosen route to any work adapted from it. Store a fixed screenplay verbatim in its designated location.
