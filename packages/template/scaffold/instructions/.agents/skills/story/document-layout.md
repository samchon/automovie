# Document layout

Where each creative document, its evidence and its review lives, and how supplied work enters.

## Documents

Each location below is a default, used when needed rather than created as an empty tree. The evidence and review locations are the installed evidence package's, whose documentation owns the supported layouts and selectors; this table is the one place the skills show them, and [evidence configuration](../evidence/configuration.md) owns their use.

Commit instructions, creative bodies and evidence answers, and keep review records local. Keep one current record per purpose, identified by its actual inputs, since Git preserves earlier tracked editions. Raw logs, classification tables, performance plans, run records and temporary comparisons belong in ignored `.cache/`, with their relevant conclusions in the current record.

| Location, when used | Owns |
| --- | --- |
| `docs/instructions/*.md` | Creative requirements, source boundaries and identified delegated writing choices |
| `docs/body/settings/<domain>/<subject>.md` | One subject's facts, one file per subject, with H2 facets and anchored H3 facts, in the domains `world`, `cast`, `crowds`, `props`, `sets`, `cinematography` and `sound` |
| `docs/body/settings/outline/index.md` | Domain and file navigation without duplicating facts |
| `docs/body/brief/<domain>/<subject>.md` | A short's [brief](layers/brief.md), one subject per file in a settings domain |
| `docs/body/treatments/NNN-event.md` | Flat ordered events, causes, consequences, and information release |
| `docs/body/scripts/NNN-part/NNN-episode.md` | Executable scenes and release partition, with part indexes |
| `docs/body/screenplay/<film>/NNN-<scene>.md`, or `NNN-part/NNN-episode/NNN-<scene>.md` on the long route | Complete final audiovisual text: one folder per delivered video, from whose path the [film name](../development/source-layout.md#source) derives, and one file per [scene](layers/screenplay.md#scenes), ordered by its number |
| `docs/research/index.md`, `docs/research/<discipline>/<topic>.md` | The source index and the studies of each practice and style: laws, outcome tables and measurable targets, under [research](planning/research.md) |
| `references/`, ignored `references/private/` | Retained research originals: permitted copies, and those whose rights are unconfirmed |
| `docs/contracts/work/...`, `docs/contracts/language/...` | This production's own story contracts supplementing the shared ones, cited as `work/...` and `language/...`; discovery writes `work/discovery/results.md` |
| `docs/contracts/statements/...` | The statements of this production's own contracts, which no evidence stage selects |
| `docs/acceptance/<film>.md` | The film's tracked acceptance record, and in `catalog.md` the catalog's accepted cases, under [delivery review](../review/delivery-review.md#acceptance-record) |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files, including `files/research/` for the research studies |
| Ignored `docs/review/draft/<layer>/<relative-file>.md` | Current independent unit reviews mirroring the actual body |
| Ignored `docs/review/draft/<layer>/verdict/index.md` | Current complete-population verdict, findings and author decisions |

`PROJECT.md` is kept under [project context](../production/project-context.md) and generation requests under [media records](../production/media-records.md).

A part can be an act, release block, or another division suited to the format. An episode can hold a suitable sequence in a continuous film; its name does not force an episodic release. Narrative partition and [source organization](../development/source-layout.md) are separate choices.

## Intake of existing work

Identify supplied settings, scripts or completed works by their original source revision or retained reference, and record their identity, adopted requirements, fixed quotations and reinterpretation boundaries as [instructions](planning/requirements.md#requirements). Existing finished work supplies material and choices to assess; it approves none of this production's layers. A user's [fixed screenplay](workflow/routes.md#who-writes-the-screenplay) is the exception: it is the screenplay, kept unchanged in the screenplay location.
