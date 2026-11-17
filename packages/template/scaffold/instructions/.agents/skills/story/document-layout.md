# Document layout

Where each creative document, its evidence and its review lives, and how supplied work enters.

## Documents

Each location is a default, created only when used. The evidence and review locations are the installed evidence package's, whose documentation owns the supported layouts and selectors; the skills show them only here, and [evidence configuration](../evidence/configuration.md) owns their use.

Commit instructions, creative bodies and evidence answers, and keep review records local. Keep one current record per purpose, identified by its actual inputs. Raw logs, classification tables, performance plans, run records and temporary comparisons belong in ignored `.cache/`, with their relevant conclusions in the current record.

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
| `docs/contracts/work/...`, `docs/contracts/language/...` | This production's own story contracts |
| `docs/contracts/statements/...` | This production's own contract statements, which no evidence stage selects |
| `docs/acceptance/<film>.md` | The film's tracked acceptance record |
| `docs/acceptance/catalog.md` | The catalog's accepted cases |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files |
| Ignored `docs/review/draft/<layer>/<relative-file>.md` | Current independent unit reviews mirroring the actual body |
| Ignored `docs/review/draft/<layer>/verdict/index.md` | Current complete-population verdict |

The verdict file also holds the findings and the author's decisions on them.

The screenplay takes one folder per delivered video, from whose path the [film name](../development/source-layout.md#source) derives, and one file per scene, ordered by its number. On the long route the file is `NNN-part/NNN-episode/NNN-<scene>.md`.

The research studies hold laws, limits and measurable targets. Their construction answers are whole-file answers, in `files/research/` of the evidence location.

The production's own story contracts supplement the shared ones and are cited as `work/...` and `language/...`. Discovery writes `work/discovery/results.md` among them.

Both acceptance records are kept under [delivery review](../review/delivery-review.md#acceptance-record), `PROJECT.md` under [project context](../production/project-context.md) and generation requests under [media records](../production/media-records.md).

A part can be an act, a release block or another division suited to the format, and an episode can hold a sequence of a continuous film without forcing an episodic release. Narrative partition and [source organization](../development/source-layout.md) are separate choices.

## Intake of existing work

Identify supplied settings, scripts or completed works by their original source revision or retained reference, and record their identity, adopted requirements, fixed quotations and reinterpretation boundaries as [instructions](planning/requirements.md#requirements). Existing finished work supplies material and choices to assess; it approves none of this production's layers. A user's fixed screenplay is the exception: it is the screenplay, kept unchanged in the screenplay location.
