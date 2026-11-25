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
| `docs/body/scripts/NNN-part/NNN-episode.md` | First-draft scenes, dialogue and release partition, with part indexes |
| `docs/body/screenplay/<film>/NNN-<scene>.md` | Complete final audiovisual text, one file per scene |
| `docs/research/index.md` | The source index |
| `docs/research/<discipline>/<topic>.md` | The studies of each practice and style |
| `references/` | Retained research originals that are permitted copies |
| Ignored `references/private/` | Retained research originals whose rights are unconfirmed |
| `docs/contracts/work/...`, `docs/contracts/language/...` | Production story contracts |
| `docs/acceptance/<film>.md` | The film's tracked acceptance record |
| `docs/acceptance/catalog.md` | The catalog's accepted cases |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files |
| Ignored `docs/review/draft/<layer>/<relative-file>.md` | Current unit reviews mirroring the manuscript |
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

<!-- @source The opening of [Knives Out](https://rian-johnson.com/pdfs/knives-out.pdf#page=2) describes the rooms along Fran's route. [ScreenSkills](https://www.screenskills.com/skills-checklists/scripted-film-and-tv/props-department/standby-props-skills/) covers prop continuity. [Movie Magic Scheduling](https://mms-docs.ep.com/Elements/ManagingElements.html) tracks named elements across scenes. -->

Identify places, people, props and groups in the scene's [standing state](layers/notation.md#records). Link each subject that has a record. Give a scene-local instance a stable name only when the action tracks it. A house key and a spare key may share a design but change hands separately. Describe other dressing and crowds collectively.

Keep the identity through changes of holder, appearance or camera. Link newly discovered subjects to their [brief](layers/brief.md#growth) or [settings record](layers/settings.md#records) when they belong there. Instructions own shared subjects on routes without canon layers.

## Intake of existing work

Identify supplied work by revision or retained reference. Record requirements, fixed quotations and reinterpretation limits in [instructions](planning/requirements.md#requirements). Apply the chosen route to any work adapted from it. Store a fixed screenplay verbatim in its designated location.
